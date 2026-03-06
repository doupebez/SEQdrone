import { google } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const RulesOutputSchema = z.object({
    rules: z.array(z.object({
        rule: z.string().describe("A concise, actionable instruction for the AI inspector"),
        source: z.string().describe("Brief description of which feedback this was distilled from")
    })).min(1).max(20)
});

const DISTILL_PROMPT = `You are an AI training specialist for a drone inspection analysis system. Your job is to take raw operator feedback about past inspection analyses and distill them into clear, concise, actionable rules that will improve future analyses.

## Instructions
- Read all the feedback entries carefully
- Group related feedback into single rules where appropriate
- Write each rule as a direct instruction to the AI inspector (use imperative mood)
- Focus on ACTIONABLE corrections — things the AI can actually change in its behavior
- Remove duplicate or contradictory feedback, keeping the most specific version
- Each rule should be 1-2 sentences max
- The "source" field should briefly note what feedback the rule came from

## Examples of Good Rules
- "Differentiate between dirt/debris staining and actual corrosion. Staining appears as uniform discoloration without metallic degradation or surface pitting."
- "Moss and lichen growth on tiles should be classified as 'Biological Growth' with 'Medium' severity, not 'Corrosion'."
- "When detecting gutter debris, estimate the percentage of gutter blocked rather than just noting its presence."
- "Hairline cracks less than 0.5mm wide in concrete should be rated 'Low' severity unless they show signs of water ingress."`;

export async function POST(req: Request) {
    try {
        const { feedbackEntries } = await req.json();

        if (!feedbackEntries || !Array.isArray(feedbackEntries) || feedbackEntries.length === 0) {
            return NextResponse.json({ error: 'No feedback entries provided' }, { status: 400 });
        }

        const feedbackText = feedbackEntries.map((f: any, i: number) => {
            let entry = `${i + 1}. [${f.category.replace('_', ' ').toUpperCase()}]`;
            if (f.surveyTitle) entry += ` Survey: "${f.surveyTitle}"`;
            if (f.findingTitle) entry += ` | Finding: "${f.findingTitle}"`;
            entry += `\n   Comment: "${f.comment}"`;
            return entry;
        }).join('\n\n');

        const result = await generateText({
            model: google('gemini-2.0-flash'),
            output: Output.object({ schema: RulesOutputSchema }),
            messages: [
                { role: 'system', content: DISTILL_PROMPT },
                {
                    role: 'user',
                    content: `Here are ${feedbackEntries.length} feedback entries from the drone inspection operator. Distill these into clear training rules:\n\n${feedbackText}`
                }
            ]
        });

        const output = result.experimental_output;

        if (!output || !output.rules) {
            return NextResponse.json({ error: 'Failed to generate rules' }, { status: 500 });
        }

        return NextResponse.json({ rules: output.rules });

    } catch (error: any) {
        console.error('[Training] Error distilling rules:', error.message);
        return NextResponse.json({
            error: 'Failed to process training feedback',
            details: error.message
        }, { status: 500 });
    }
}
