import { useState } from 'react';
import {
    UserRound,
    LockKeyhole,
    Eye,
    EyeOff,
    ArrowRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const { login, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        const result = await login(username, password, rememberMe);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setErrorMessage(result.message);
        }
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,#FFFFFF_0%,#EAF5FC_55%,#DCECF8_100%)] px-5 py-10">

            {/* Login Card */}
            <section className="w-full max-w-[420px] rounded-[24px] border border-white/80 bg-white/75 px-8 py-10 shadow-[0_12px_45px_rgba(20,45,80,0.07)] backdrop-blur-xl sm:px-10 sm:py-12">

                {/* Logo */}
                <div className="mb-7 flex justify-center">
                    <div className="relative flex h-[64px] w-[64px] items-center justify-center">

                        <svg
                            viewBox="0 0 64 64"
                            className="absolute inset-0 h-full w-full"
                            fill="none"
                        >
                            {Array.from({ length: 12 }).map((_, index) => (
                                <ellipse
                                    key={index}
                                    cx="32"
                                    cy="9"
                                    rx="3"
                                    ry="5"
                                    fill="#2463A6"
                                    opacity={0.35 + (index % 3) * 0.2}
                                    transform={`rotate(${index * 30} 32 32)`}
                                />
                            ))}
                        </svg>

                        <span className="text-[35px] font-bold text-[#2463A6]">
                            S
                        </span>
                    </div>
                </div>

                {/* Heading */}
                <div className="mb-10 text-center">
                    <h1 className="text-[25px] font-bold tracking-tight text-[#142D50]">
                        CV Sintesa Mandiri Karya
                    </h1>

                    <p className="mx-auto mt-2 max-w-[300px] text-sm leading-[22px] text-gray-500">
                        Masuk ke sistem informasi manajemen persediaan{' '}
                        <strong>CV Sintesa Mandiri Karya.</strong>
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Username */}
                    <div>
                        <label
                            htmlFor="username"
                            className="mb-2 block text-[13px] font-medium text-[#142D50]"
                        >
                            Username
                        </label>

                        <div className="flex h-[48px] items-center rounded-xl border border-[#E4EDF6] bg-white px-3.5 transition-all focus-within:border-[#75B9E7] focus-within:ring-4 focus-within:ring-[#75B9E7]/10">

                            <UserRound
                                size={19}
                                className="shrink-0 text-gray-400"
                            />

                            <input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="Masukkan username"
                                autoComplete="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="h-full w-full bg-transparent px-4 text-sm text-[#142D50] outline-none placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label
                            htmlFor="password"
                            className="mb-2 block text-[13px] font-medium text-[#142D50]"
                        >
                            Password
                        </label>

                        <div className="flex h-[48px] items-center rounded-xl border border-[#E4EDF6] bg-white px-3.5 transition-all focus-within:border-[#75B9E7] focus-within:ring-4 focus-within:ring-[#75B9E7]/10">

                            <LockKeyhole
                                size={19}
                                className="shrink-0 text-gray-400"
                            />

                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Masukkan password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-full w-full bg-transparent px-4 text-sm text-[#142D50] outline-none placeholder:text-gray-400"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="flex shrink-0 items-center justify-center text-gray-400 transition hover:text-[#2463A6]"
                                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                            >
                                {showPassword ? (
                                    <EyeOff size={19} />
                                ) : (
                                    <Eye size={19} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {errorMessage && (
                        <div
                            role="alert"
                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                        >
                            {errorMessage}
                        </div>
                    )}

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between gap-3">

                        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-gray-600">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 cursor-pointer accent-[#2463A6]"
                            />

                            Remember me
                        </label>

                        <button
                            type="button"
                            className="text-[13px] font-medium text-[#2463A6] transition hover:text-[#142D50]"
                            onClick={() => alert('Fitur lupa password akan tersedia pada pengembangan berikutnya.')}
                        >
                            Forgot password?
                        </button>
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-[#142D50] text-sm font-semibold text-white shadow-[0_8px_18px_rgba(20,45,80,0.17)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1C3C66] hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {loading ? 'Memproses...' : 'Masuk'}

                        {!loading && <ArrowRight size={18} />}
                    </button>

                </form>

                {/* Footer */}
                <footer className="mt-10 text-center">
                    <p className="text-xs text-gray-400">
                        © 2026 CV Sintesa Mandiri Karya. All rights reserved.
                    </p>
                </footer>

            </section>
        </main>
    );
}

export default LoginPage;