import { Suspense } from 'react';
import LoginForm from './login-form';

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <div className="animate-pulse text-slate-500 text-sm">Loading...</div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
