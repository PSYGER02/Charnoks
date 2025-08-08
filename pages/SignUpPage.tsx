import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../hooks/useSupabaseAuth';
import Spinner from '../components/ui/Spinner';

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);

const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
    </svg>
);

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
    </svg>
);

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
);

const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781z" clipRule="evenodd" />
        <path d="M2 10s3.939-7 8-7 8 7 8 7-3.939 7-8 7-8-7-8-7zm7.939 2.553a2.5 2.5 0 01-3.498-3.498l3.498 3.498z" />
    </svg>
);

const LogoIcon = () => (
    <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-2xl p-2">
        <img 
            src="/Charnoks logo-192x192.png" 
            alt="Charnoks Logo" 
            className="w-20 h-20 object-contain drop-shadow-lg" 
        />
    </div>
);

const SignUpPage: React.FC = () => {
    const navigate = ReactRouterDOM.useNavigate();
    const auth = useAuth();
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSigningUp, setIsSigningUp] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsSigningUp(true);
        try {
            // Always create as owner account through signup page
            const user = await auth.signup(name, email, password, 'owner');
            // Navigate based on role
            if (user.role === 'owner') {
                navigate('/owner/dashboard', { replace: true });
            } else {
                // This should never happen for new signups
                navigate('/worker/dashboard', { replace: true });
            }
        } catch (err: any) {
            setError(err.message || "Failed to create an account. Please try again.");
        } finally {
            setIsSigningUp(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center space-y-4 animate-bounce-in" style={{animationDelay: '100ms'}}>
                    <div className="flex justify-center">
                        <LogoIcon />
                    </div>
                    
                    <div>
                        <div className="flex items-center justify-center gap-3 animate-bounce-in" style={{animationDelay: '150ms'}}>
                            <img 
                                src="/Charnoks logo-192x192.png" 
                                alt="Charnoks" 
                                className="w-12 h-12 object-contain drop-shadow-lg" 
                            />
                            <h1 className="text-5xl font-bold brand-title">
                                CHARNOKS
                            </h1>
                        </div>
                        <p className="text-lg brand-subtitle mt-2 animate-bounce-in" style={{animationDelay: '200ms'}}>
                            Point of Sale System
                        </p>
                        <p className="text-sm text-white/70 mt-1 animate-bounce-in" style={{animationDelay: '250ms'}}>
                            🍗 Special Fried Chicken & More
                        </p>
                    </div>
                </div>

                <h2 className="text-2xl font-semibold text-center text-white animate-bounce-in" style={{animationDelay: '300ms'}}>🚀 Create Owner Account</h2>
                <p className="text-center text-white/80 animate-bounce-in" style={{animationDelay: '350ms'}}>Set up your Charnoks restaurant management system</p>

                <form className="space-y-5 animate-bounce-in" style={{animationDelay: '400ms'}} onSubmit={handleSignUp}>
                    <div>
                        <label htmlFor="full-name" className="sr-only">Full Name</label>
                         <div className="flex items-center bg-accent/20 rounded-lg p-1 border border-transparent focus-within:border-white/50">
                            <span className="px-3 text-white/70"><UserIcon /></span>
                            <input
                                id="full-name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="block w-full bg-transparent py-2.5 pr-3 text-white placeholder-white/60 focus:outline-none"
                                placeholder="Full Name"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email-address" className="sr-only">Email address</label>
                         <div className="flex items-center bg-accent/20 rounded-lg p-1 border border-transparent focus-within:border-white/50">
                            <span className="px-3 text-white/70"><MailIcon /></span>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full bg-transparent py-2.5 pr-3 text-white placeholder-white/60 focus:outline-none"
                                placeholder="Email address"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="sr-only">Password</label>
                        <div className="flex items-center bg-accent/20 rounded-lg p-1 border border-transparent focus-within:border-white/50">
                             <span className="px-3 text-white/70"><LockIcon /></span>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full bg-transparent py-2.5 text-white placeholder-white/60 focus:outline-none"
                                placeholder="Password"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-3 text-white/70 focus:outline-none" aria-label={showPassword ? "Hide password" : "Show password"}>
                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
                        <div className="flex items-center bg-accent/20 rounded-lg p-1 border border-transparent focus-within:border-white/50">
                             <span className="px-3 text-white/70"><LockIcon /></span>
                            <input
                                id="confirm-password"
                                name="confirm-password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full bg-transparent py-2.5 text-white placeholder-white/60 focus:outline-none"
                                placeholder="Confirm Password"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-300 text-sm text-center bg-red-500/20 p-2 rounded-lg">{error}</p>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isSigningUp}
                            className="w-full flex justify-center py-3 px-4 text-base font-bold rounded-lg text-text-on-primary bg-card-bg-solid shadow-lg shadow-black/20 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary disabled:opacity-50"
                        >
                            {isSigningUp ? <Spinner size="sm" /> : 'Sign Up'}
                        </button>
                    </div>
                </form>

                <p className="text-center text-sm text-white/60 animate-bounce-in" style={{animationDelay: '500ms'}}>
                    Already have an account? <ReactRouterDOM.Link to="/login" className="font-medium text-white/80 hover:text-white">Login</ReactRouterDOM.Link>
                </p>
            </div>
        </div>
    );
};

export default SignUpPage;
