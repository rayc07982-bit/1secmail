
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Email, EmailBody } from './types';
import { generateRandomEmail, getMessages, readMessage } from './services/mailService';
import { MailIcon, CopyIcon, RefreshIcon, NewMailIcon, CheckIcon, ShieldCheckIcon, ZapIcon, TrashIcon, XIcon, SearchIcon } from './components/icons';

// Fix: Moved TempMailLink component outside of the App component to prevent it from being redeclared on every render.
// Fix: The children prop is made optional to address a TypeScript error about a missing required prop.
const TempMailLink = ({ children }: { children?: React.ReactNode }) => (
  <a href="https://1sec-mail.pro/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{children}</a>
);

const App: React.FC = () => {
    const [emailAddress, setEmailAddress] = useState<string | null>(null);
    const [messages, setMessages] = useState<Email[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<EmailBody | null>(null);
    const [isLoadingEmail, setIsLoadingEmail] = useState<boolean>(true);
    const [isLoadingInbox, setIsLoadingInbox] = useState<boolean>(false);
    const [isLoadingMessage, setIsLoadingMessage] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [copyNotification, setCopyNotification] = useState<boolean>(false);

    const intervalRef = useRef<number | null>(null);

    const clearPolling = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const fetchMessages = useCallback(async () => {
        if (!emailAddress) return;
        setIsLoadingInbox(true);
        try {
            const [login, domain] = emailAddress.split('@');
            const newMessages = await getMessages(login, domain);
            setMessages(newMessages.sort((a, b) => b.id - a.id));
        } catch (err) {
            // Do not show error for fetching, as it's a background task
            console.error(err);
        } finally {
            setIsLoadingInbox(false);
        }
    }, [emailAddress]);

    const setupPolling = useCallback(() => {
        clearPolling();
        if (emailAddress) {
            fetchMessages(); // initial fetch
            intervalRef.current = window.setInterval(fetchMessages, 7000); // Poll every 7 seconds
        }
    }, [emailAddress, fetchMessages]);

    const handleGenerateNewEmail = useCallback(async () => {
        clearPolling();
        setIsLoadingEmail(true);
        setMessages([]);
        setEmailAddress(null);
        setError(null);
        try {
            const newEmail = await generateRandomEmail();
            setEmailAddress(newEmail);
        } catch (err) {
            setError('Could not generate a new email. Please try again.');
        } finally {
            setIsLoadingEmail(false);
        }
    }, []);

    useEffect(() => {
        handleGenerateNewEmail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setupPolling();
        return () => clearPolling();
    }, [setupPolling]);


    const handleCopyEmail = () => {
        if (!emailAddress) return;
        navigator.clipboard.writeText(emailAddress);
        setCopyNotification(true);
        setTimeout(() => setCopyNotification(false), 2000);
    };

    const handleViewMessage = async (id: number) => {
        if (!emailAddress) return;
        setIsLoadingMessage(true);
        setSelectedMessage(null); // Clear previous message
        try {
            const [login, domain] = emailAddress.split('@');
            const messageBody = await readMessage(login, domain, id);
            setSelectedMessage(messageBody);
        } catch (err) {
            setError('Could not load the email content.');
        } finally {
            setIsLoadingMessage(false);
        }
    };
    

    return (
        <div className="bg-primary text-gray-200 min-h-screen font-sans">
            <div className="bg-primary/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-20 border-b border-gray-800">
                <header className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <MailIcon className="w-8 h-8 text-accent" />
                        <h1 className="text-2xl font-bold tracking-tight">
                            <a href="https://1sec-mail.pro/" target="_blank" rel="noopener noreferrer">1sec Mail</a>
                        </h1>
                    </div>
                </header>
            </div>

            <main className="pt-24 pb-12">
                <section id="hero" className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-4 animate-fade-in bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                        Your Instant & Secure <TempMailLink>Temp Mail</TempMailLink>
                    </h2>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        Protect your privacy from spam. Use a free, anonymous, and disposable email address.
                    </p>
                    
                    <div className="bg-secondary rounded-lg p-4 md:p-6 max-w-2xl mx-auto shadow-lg border border-gray-800 animate-slide-in-up">
                        <div className="bg-primary rounded-md p-3 border border-gray-700 flex items-baseline justify-center flex-wrap">
                             <span className="text-gray-400 mr-2 text-lg">Your temporary email address:</span>
                             {isLoadingEmail ? (
                                 <span className="text-gray-500 animate-pulse text-lg">Generating...</span>
                             ) : (
                                 <span className="text-xl text-accent font-bold tracking-wider">{emailAddress || ''}</span>
                             )}
                        </div>
                         <p className="text-xs text-gray-500 mt-2 text-center">
                            Demo Address: <span className="font-mono">demo@1secmail.com</span>
                        </p>
                        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <button onClick={handleCopyEmail} className="flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50" disabled={!emailAddress}>
                                {copyNotification ? <CheckIcon className="w-5 h-5 text-green-400"/> : <CopyIcon className="w-5 h-5" />}
                                <span>{copyNotification ? 'Copied!' : 'Copy'}</span>
                            </button>
                            <button onClick={fetchMessages} className="flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50" disabled={!emailAddress}>
                                <RefreshIcon className={`w-5 h-5 ${isLoadingInbox ? 'animate-spin' : ''}`} />
                                <span>Refresh</span>
                            </button>
                            <button onClick={handleGenerateNewEmail} className="flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200">
                                <NewMailIcon className="w-5 h-5"/>
                                <span>New Email</span>
                            </button>
                             <a href="https://1sec-mail.pro/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-2 bg-accent hover:bg-accent-hover text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200">
                                <SearchIcon className="w-5 h-5" />
                                <span>Check Inbox</span>
                            </a>
                        </div>
                    </div>
                </section>

                <section id="inbox" className="container mx-auto px-4 mt-12">
                    <div className="bg-secondary rounded-lg shadow-lg border border-gray-800 max-w-4xl mx-auto">
                        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                            <h3 className="text-xl font-bold">Inbox</h3>
                            {isLoadingInbox && <div className="w-5 h-5 border-2 border-t-accent border-gray-600 rounded-full animate-spin"></div>}
                        </div>
                        <div className="h-96 overflow-y-auto">
                            {messages.length > 0 ? (
                                <ul>
                                    {messages.map((msg) => (
                                        <li key={msg.id} onClick={() => handleViewMessage(msg.id)} className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer p-4 transition-colors duration-200 animate-fade-in">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-grow truncate">
                                                    <p className="font-semibold text-gray-300 truncate">{msg.from}</p>
                                                    <p className="text-gray-400 truncate">{msg.subject}</p>
                                                </div>
                                                <div className="flex-shrink-0 ml-4 text-xs text-gray-500 text-right">
                                                    {new Date(msg.date).toLocaleString()}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <MailIcon className="w-16 h-16 mb-4" />
                                    <p className="font-semibold">Your inbox is empty</p>
                                    <p>Waiting for incoming emails...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section id="features" className="container mx-auto px-4 mt-20 text-center">
                    <h3 className="text-3xl font-bold mb-2">Why use a <TempMailLink>Temp Mail</TempMailLink>?</h3>
                    <p className="text-gray-400 max-w-2xl mx-auto mb-12">Our service is designed with your privacy and convenience in mind.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-secondary p-6 rounded-lg border border-gray-800">
                            <ShieldCheckIcon className="w-12 h-12 text-accent mx-auto mb-4" />
                            <h4 className="text-xl font-semibold mb-2">Privacy Protection</h4>
                            <p className="text-gray-400">Keep your real email address private and avoid tracking and data leaks.</p>
                        </div>
                        <div className="bg-secondary p-6 rounded-lg border border-gray-800">
                            <ZapIcon className="w-12 h-12 text-accent mx-auto mb-4" />
                            <h4 className="text-xl font-semibold mb-2">Instant & Free</h4>
                            <p className="text-gray-400">Get a fully-functional email address in one click, no registration required.</p>
                        </div>
                        <div className="bg-secondary p-6 rounded-lg border border-gray-800">
                            <TrashIcon className="w-12 h-12 text-accent mx-auto mb-4" />
                            <h4 className="text-xl font-semibold mb-2">Spam-Free Life</h4>
                            <p className="text-gray-400">Sign up for services without worrying about your main inbox flooding with junk mail.</p>
                        </div>
                    </div>
                </section>

                <footer className="container mx-auto px-4 mt-20 pt-8 border-t border-gray-800 text-center text-gray-500">
                    <p>&copy; {new Date().getFullYear()} <a href="https://1sec-mail.pro/" target="_blank" rel="noopener noreferrer" className="hover:text-accent">1sec Mail</a>. All Rights Reserved.</p>
                    <p className="mt-2 text-sm">This is a landing page for <TempMailLink>1sec Mail</TempMailLink> and uses a public API for demonstration.</p>
                </footer>
            </main>

            {/* Email View Modal */}
            {(selectedMessage || isLoadingMessage) && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setSelectedMessage(null)}>
                    <div className="bg-secondary rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-700" onClick={e => e.stopPropagation()}>
                        {isLoadingMessage ? (
                             <div className="flex items-center justify-center h-96">
                                 <div className="w-12 h-12 border-4 border-t-accent border-gray-600 rounded-full animate-spin"></div>
                             </div>
                        ) : selectedMessage && (
                            <>
                                <div className="p-4 border-b border-gray-800 flex justify-between items-center flex-shrink-0">
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-100">{selectedMessage.subject}</h4>
                                        <p className="text-sm text-gray-400">From: {selectedMessage.from}</p>
                                        <p className="text-xs text-gray-500">Date: {new Date(selectedMessage.date).toLocaleString()}</p>
                                    </div>
                                    <button onClick={() => setSelectedMessage(null)} className="p-2 rounded-full hover:bg-gray-700">
                                        <XIcon className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>
                                <div className="p-1 overflow-y-auto flex-grow">
                                    <iframe
                                        srcDoc={selectedMessage.htmlBody || `<pre>${selectedMessage.textBody}</pre>`}
                                        title="Email content"
                                        className="w-full h-full border-0 bg-white"
                                        sandbox="allow-same-origin"
                                    />
                                </div>
                                {selectedMessage.attachments.length > 0 && (
                                     <div className="p-4 border-t border-gray-800 flex-shrink-0">
                                        <h5 className="font-semibold mb-2">Attachments:</h5>
                                        <ul className="flex flex-wrap gap-2">
                                            {selectedMessage.attachments.map(att => (
                                                <li key={att.filename} className="bg-gray-700 text-sm px-3 py-1 rounded-full">{att.filename} ({Math.round(att.size / 1024)} KB)</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
