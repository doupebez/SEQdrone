import { google } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

// Schema for a single finding
const FindingSchema = z.object({
    title: z.string().describe("Short descriptive title, e.g. 'Gutter Debris Accumulation', 'Perimeter Flashing Corrosion'"),
    severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
    conditionRating: z.enum(['Excellent', 'Good', 'Fair', 'Poor', 'Critical']),
    confidenceScore: z.number().min(50).max(99).describe("Detection confidence 50-99"),
    defectType: z.string().describe("Category: Cracking, Corrosion, Water Damage, Maintenance, Structural, Efficiency, Biological Growth, Mechanical Damage, Weathering, Misalignment"),
    component: z.string().describe("Affected component: be specific, e.g. 'North Gutter Run', 'Ridge Cap Section B', 'Solar Panel Row 3', 'East Fascia Board', 'Valley Flashing'"),
    areaLocation: z.string().describe("Where on the asset this defect is located using compass directions and position descriptors, e.g. 'Northwest corner, upper roof plane', 'Southeast ridge line, near hip junction', 'Central section, above second-floor windows'"),
    focalPoint: z.array(z.number()).length(2).describe(
        "The exact [y, x] center point of the defect on a 0-1000 normalized scale. " +
        "y=0 is the TOP of the image, y=1000 is the BOTTOM. " +
        "x=0 is the LEFT, x=1000 is the RIGHT. " +
        "Example: [500, 500] is the exact center of the image."
    ),
    estimatedSize: z.string().describe("Rough estimated size of the defect in human-readable terms, e.g. '~30cm crack', '~2m section of gutter', '~0.5m² area'"),
    description: z.string().describe("Professional 2-3 sentence description of the visual evidence, what the defect looks like, and potential consequences if left untreated"),
    recommendation: z.string().describe("Specific actionable remediation recommendation with suggested timeline, e.g. 'Engage licensed plumber to reseal flashing within 30 days to prevent moisture ingress.'")
});

// Full analysis result schema
const AnalysisSchema = z.object({
    findings: z.array(FindingSchema).min(1).max(8).describe("All detected defects in this image — be thorough"),
    healthScore: z.number().min(0).max(100).describe("Asset health score 0-100 based on overall condition visible in this image"),
    areaDescription: z.string().describe("Describe what area/section of the asset this image shows, e.g. 'North-facing roof plane showing colorbond sheeting and gutter line', 'Aerial view of solar array on western roof section'"),
    summary: z.string().describe("2-3 sentence executive summary of inspection results for this image")
});

const SYSTEM_PROMPT = `You are an elite certified building inspector specializing in drone-based asset surveys for SEQ Drone Inspections, a professional Australian inspection company based in South East Queensland.

You are analyzing high-resolution drone imagery captured during a professional inspection flight. Your analysis will be used in formal engineering inspection reports delivered to clients.

## DETECTION PROTOCOL

You MUST systematically scan the ENTIRE image and identify ALL visible defects, issues, or areas of concern. Do NOT skip small or subtle issues. Be thorough.

### Defect Categories to Check:
1. **Structural Issues**: Cracking (hairline, structural, settlement), sagging, displacement, deformation, missing components
2. **Corrosion & Deterioration**: Rust, oxidation, galvanic corrosion on metal fixings/flashing/sheeting, paint peeling
3. **Water Damage**: Ponding, staining, water trails, moisture marks, efflorescence, algae/moss/lichen growth
4. **Maintenance Issues**: Debris in gutters (leaves, dirt, organic matter), blocked downpipes, vegetation growth, bird nesting
5. **Weathering**: UV degradation, color fading, surface erosion, wind damage, hail impact marks
6. **Component Failures**: Displaced tiles, lifted flashing, popped fasteners, failed sealant, broken fixtures
7. **Solar Specific** (if solar panels visible): Hotspots, micro-cracks, soiling, delamination, junction box damage, bird nesting underneath
8. **Safety Hazards**: Loose materials, trip hazards on walkways, damaged safety rails, unsecured equipment

### Area Mapping
For each image, describe WHAT PART of the asset is visible (e.g., 'northern roof plane', 'eastern gutter run', 'solar array west section'). Use compass directions if the orientation is discernible.

### Defect Pinpointing
- Identify the exact visual center of the defect
- Return a single \`focalPoint\` using [y, x] format where (0,0) is top-left and (1000,1000) is bottom-right
- Make sure the point lands exactly on the damaged area

### Report Writing Standards
- Write in third-person professional tone
- Reference visible evidence specifically (e.g., "Visible oxidation staining extends approximately 300mm along the intersection")
- Mention potential consequences (e.g., "If left untreated, moisture ingress may compromise the roof substrate")
- Recommendations must include a suggested action AND timeframe

### Confidence Scoring
- 90-99: Clearly visible, unmistakable defect with high certainty
- 80-89: Visible defect, minor ambiguity in extent or severity
- 70-79: Probable defect, partially obscured or subtle
- 50-69: Possible defect, requires physical inspection to confirm`;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { images, jobData, trainingRules } = body;

        if (!images || !Array.isArray(images) || images.length === 0) {
            return NextResponse.json({ error: 'No images provided' }, { status: 400 });
        }

        console.log(`[Analyze] ═══════════════════════════════════════`);
        console.log(`[Analyze] Starting analysis of ${images.length} images`);
        console.log(`[Analyze] Job: ${jobData?.title || 'Untitled'} | Type: ${jobData?.type || 'general'}`);

        // Log image uniqueness for debugging
        const imageLengths = images.map((img: string, i: number) => {
            const len = img?.length || 0;
            console.log(`[Analyze] Image ${i}: ${len} chars, starts with: ${img?.substring(0, 40)}...`);
            return len;
        });
        const uniqueLengths = new Set(imageLengths);
        if (uniqueLengths.size < images.length) {
            console.warn(`[Analyze] ⚠ WARNING: Some images may be duplicates! ${uniqueLengths.size} unique sizes out of ${images.length} images`);
        }

        const allFindings: any[] = [];
        let worstHealthScore = 100;
        let summaryParts: string[] = [];
        let areaDescriptions: string[] = [];

        // Build context from job data
        const assetType = jobData?.type || 'general';
        const userDescription = jobData?.description || '';
        const assetTypeLabels: Record<string, string> = {
            'roof': 'Roof Inspection',
            'solar': 'Solar Panel Inspection',
            'facade': 'Building Facade Inspection',
            'bridge': 'Bridge Structural Inspection',
            'tower': 'Communication Tower Inspection',
            'turbine': 'Wind Turbine Inspection',
            'tank': 'Water Tank Inspection',
        };
        const inspectionContext = assetTypeLabels[assetType] || 'General Asset Inspection';

        // Build dynamic system prompt with training rules
        let dynamicPrompt = SYSTEM_PROMPT;
        if (trainingRules && Array.isArray(trainingRules) && trainingRules.length > 0) {
            const rulesSection = trainingRules.map((r: string) => `- ${r}`).join('\n');
            dynamicPrompt += `\n\n## LEARNED CORRECTIONS\nThe following corrections have been provided by the inspection operator based on review of your past analyses. Apply these rules to improve your accuracy:\n${rulesSection}`;
            console.log(`[Analyze] Injecting ${trainingRules.length} training rules into system prompt`);
        }

        for (let i = 0; i < images.length; i++) {
            console.log(`[Analyze] ─── Processing image ${i + 1} of ${images.length} ───`);

            try {
                const imageData = images[i];

                if (!imageData || typeof imageData !== 'string' || imageData.length < 100) {
                    console.error(`[Analyze] Image ${i + 1}: Invalid or empty image data (length: ${imageData?.length || 0})`);
                    continue;
                }

                const userPrompt = [
                    `INSPECTION TYPE: ${inspectionContext}`,
                    `IMAGE: ${i + 1} of ${images.length}`,
                    userDescription ? `OPERATOR NOTES: ${userDescription}` : '',
                    ``,
                    `Analyze this drone inspection image thoroughly. This is image ${i + 1} of a ${images.length}-image survey set.`,
                    ``,
                    `1. DESCRIBE what area/section of the ${assetType} asset is visible in this image`,
                    `2. IDENTIFY ALL visible defects, damage, or maintenance issues — be thorough, check every area of the image`,
                    `3. IDENTIFY the exact focal point of each defect on the 0-1000 coordinate grid`,
                    `4. Provide professional descriptions and actionable recommendations with timeframes`
                ].filter(Boolean).join('\n');

                const result = await generateText({
                    model: google('gemini-2.0-flash'),
                    output: Output.object({ schema: AnalysisSchema }),
                    messages: [
                        {
                            role: 'system',
                            content: dynamicPrompt
                        },
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: userPrompt
                                },
                                {
                                    type: 'image',
                                    image: imageData
                                }
                            ]
                        }
                    ]
                });

                const analysisResult = result.experimental_output;

                if (analysisResult && analysisResult.findings) {
                    const mappedFindings = analysisResult.findings.map((f: any, j: number) => ({
                        ...f,
                        imageIndex: i,
                        focalPoint: f.focalPoint,
                        id: `finding-${Date.now()}-${i}-${j}`,
                        annotations: []
                    }));

                    allFindings.push(...mappedFindings);
                    worstHealthScore = Math.min(worstHealthScore, analysisResult.healthScore);
                    summaryParts.push(analysisResult.summary);
                    if (analysisResult.areaDescription) {
                        areaDescriptions.push(`Image ${i + 1}: ${analysisResult.areaDescription}`);
                    }

                    console.log(`[Analyze] Image ${i + 1}: ✓ Found ${analysisResult.findings.length} defects, health: ${analysisResult.healthScore}`);
                    analysisResult.findings.forEach((f: any, j: number) => {
                        console.log(`[Analyze]   → Finding ${j + 1}: "${f.title}" [${f.severity}] @ ${f.areaLocation || 'unknown location'}`);
                    });
                } else {
                    console.warn(`[Analyze] Image ${i + 1}: ⚠ No findings returned from AI`);
                }

            } catch (imageError: any) {
                console.error(`[Analyze] Image ${i + 1}: ✗ Error:`, imageError.message);
                // Continue processing remaining images even if one fails
            }
        }

        // If no findings at all, return a default good-condition result
        if (allFindings.length === 0) {
            allFindings.push({
                id: `finding-${Date.now()}-default`,
                title: "No Significant Defects Detected",
                severity: "Low",
                conditionRating: "Good",
                confidenceScore: 85,
                defectType: "None",
                component: "General",
                areaLocation: "Overall asset",
                estimatedSize: "N/A",
                imageIndex: 0,
                focalPoint: [500, 500],
                annotations: [],
                description: "Visual inspection did not identify significant defects. The asset appears to be in serviceable condition with no immediate remediation required.",
                recommendation: "Continue routine maintenance schedule. Re-inspect in 12 months or after any severe weather event."
            });
        }

        // Build comprehensive summary
        const combinedSummary = summaryParts.length > 0
            ? summaryParts.join(' ')
            : `Analysis completed. ${allFindings.length} finding(s) identified across ${images.length} image(s).`;

        const response = {
            damages: allFindings,
            assetPolygon: [[50, 50], [50, 950], [950, 950], [950, 50]],
            assetHealthScore: worstHealthScore,
            areaDescriptions,
            summary: combinedSummary,
            imageCount: images.length
        };

        console.log(`[Analyze] ═══════════════════════════════════════`);
        console.log(`[Analyze] ✓ Complete. ${allFindings.length} findings across ${images.length} images. Health: ${worstHealthScore}`);
        allFindings.forEach((f, i) => {
            console.log(`[Analyze]   Finding ${i + 1}: "${f.title}" → imageIndex=${f.imageIndex}`);
        });

        return NextResponse.json(response);

    } catch (error: any) {
        console.error("[Analyze] Fatal error:", error.message);
        console.error("[Analyze] Stack:", error.stack);

        return NextResponse.json({
            error: 'Failed to process analysis',
            details: error.message
        }, { status: 500 });
    }
}

