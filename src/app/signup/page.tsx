import { Suspense } from 'react';
import SignupForm from './signup-form';

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <div className="animate-pulse text-slate-500 text-sm">Loading...</div>
            </div>
        }>
            <SignupForm />
        </Suspense>
    );
}
