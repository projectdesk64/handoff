import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Footer } from './Footer';
import Logo from '../assets/logo.webp';

interface LayoutProps {
    children: ReactNode;
    title?: string;
    actions?: ReactNode;
}

export function Layout({ children, title, actions }: LayoutProps) {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
            {/* Static Header */}
            <header className="bg-card border-b border-border">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="flex items-center gap-2">
                            <img src={Logo} alt="HandOff" className="h-12 w-auto" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
                {(title || actions) && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        {title && (
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">
                                {title}
                            </h1>
                        )}
                        {actions && (
                            <div className="flex items-center gap-3">
                                {actions}
                            </div>
                        )}
                    </div>
                )}

                {/* Page Content */}
                <div>
                    {children}
                </div>
            </main>

            <Footer />
        </div>
    );
}
