"use client";
import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageProvider';
import { TOPPINGS } from '../lib/toppings';

type MenuItem = { id: number | null; name: string; price: number; category?: string | null };
type CartItem = MenuItem & {
    quantity: number;
    custom?: {
        size: 'regular' | 'large';
        temperature: 'hot' | 'cold';
        ice: 'low' | 'medium' | 'high';
        sugar: 'low' | 'medium' | 'high';
        toppings?: number[]
    }
};

const SIZE_PRICES = { regular: 0, large: 0.75 };
const TOPPING_PRICE = 0.50;

interface VoiceOrderProps {
    menuItems: MenuItem[];
    onAddToCart: (item: CartItem) => void;
}

export default function VoiceOrder({ menuItems, onAddToCart }: VoiceOrderProps) {
    const { t } = useLanguage();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [liveTranscript, setLiveTranscript] = useState(''); // Live interim transcript
    const [parsedOrder, setParsedOrder] = useState<CartItem | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [error, setError] = useState('');
    const [recognition, setRecognition] = useState<any>(null);
    const [availableMics, setAvailableMics] = useState<MediaDeviceInfo[]>([]);
    const [selectedMicId, setSelectedMicId] = useState<string>('');
    const [showMicDropdown, setShowMicDropdown] = useState(false);

    useEffect(() => {
        // Initialize speech recognition
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognitionInstance = new SpeechRecognition();
                recognitionInstance.continuous = false;
                recognitionInstance.interimResults = true; // Enable interim results for live transcription
                recognitionInstance.lang = 'en-US';

                recognitionInstance.onresult = (event: any) => {
                    let interimTranscript = '';
                    let finalTranscript = '';

                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            finalTranscript += transcript;
                        } else {
                            interimTranscript += transcript;
                        }
                    }

                    // Update live transcript for display
                    setLiveTranscript(interimTranscript);

                    // When final result is available, parse it
                    if (finalTranscript) {
                        const fullTranscript = finalTranscript.toLowerCase();
                        setTranscript(fullTranscript);
                        parseOrder(fullTranscript);
                    }
                };

                recognitionInstance.onerror = (event: any) => {
                    setError(`Speech recognition error: ${event.error}`);
                    setIsListening(false);
                };

                recognitionInstance.onend = () => {
                    setIsListening(false);
                };

                setRecognition(recognitionInstance);
            }
        }

        // Enumerate available microphones
        enumerateMicrophones();
    }, []);

    const enumerateMicrophones = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const microphones = devices.filter(device => device.kind === 'audioinput');
            setAvailableMics(microphones);
            if (microphones.length > 0 && !selectedMicId) {
                setSelectedMicId(microphones[0].deviceId);
            }
        } catch (err) {
            console.error('Error enumerating microphones:', err);
        }
    };

    const handleMicChange = async (deviceId: string) => {
        setSelectedMicId(deviceId);
        setShowMicDropdown(false);

        // Request permission for the selected microphone
        try {
            await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: { exact: deviceId } }
            });
        } catch (err) {
            console.error('Error accessing microphone:', err);
        }
    };

    const parseOrder = (speech: string) => {
        // Find menu item by fuzzy matching
        const menuItem = findMenuItem(speech);
        if (!menuItem) {
            setError('Could not find that item on the menu. Please try again.');
            return;
        }

        // Parse customizations
        const size = parseSize(speech);
        const temperature = parseTemperature(speech);
        const ice = parseIce(speech);
        const sugar = parseSugar(speech);
        const toppings = parseToppings(speech);

        // Calculate price with customizations
        const sizeUpcharge = SIZE_PRICES[size];
        const toppingsUpcharge = toppings.length * TOPPING_PRICE;
        const totalPrice = menuItem.price + sizeUpcharge + toppingsUpcharge;

        const order: CartItem = {
            ...menuItem,
            quantity: 1,
            price: totalPrice,
            custom: {
                size,
                temperature,
                ice,
                sugar,
                toppings: toppings.length > 0 ? toppings : undefined
            }
        };

        setParsedOrder(order);
        setShowConfirmation(true);
        setError('');
    };

    const findMenuItem = (speech: string): MenuItem | null => {
        // Normalize speech for matching
        const normalized = speech.toLowerCase().trim();

        // Try exact match first
        let found = menuItems.find(item =>
            normalized.includes(item.name.toLowerCase())
        );

        if (found) return found;

        // Try fuzzy matching for common variations
        const variations: { [key: string]: string[] } = {
            'taro milk tea': ['taro', 'taro tea'],
            'thai milk tea': ['thai', 'thai tea'],
            'brown sugar boba': ['brown sugar', 'brown sugar milk tea'],
            'matcha latte': ['matcha', 'green tea latte'],
            'classic milk tea': ['classic', 'original', 'regular milk tea'],
        };

        for (const item of menuItems) {
            const itemName = item.name.toLowerCase();
            const variantList = variations[itemName] || [];

            if (variantList.some(variant => normalized.includes(variant))) {
                return item;
            }
        }

        return null;
    };

    const parseSize = (speech: string): 'regular' | 'large' => {
        if (speech.includes('large') || speech.includes('big')) return 'large';
        if (speech.includes('small')) return 'regular';
        return 'regular';
    };

    const parseTemperature = (speech: string): 'hot' | 'cold' => {
        if (speech.includes('hot') || speech.includes('warm')) return 'hot';
        return 'cold';
    };

    const parseIce = (speech: string): 'low' | 'medium' | 'high' => {
        if (speech.includes('no ice') || speech.includes('without ice')) return 'low';
        if (speech.includes('extra ice') || speech.includes('lots of ice')) return 'high';
        if (speech.includes('light ice') || speech.includes('less ice') || speech.includes('low ice')) return 'low';
        return 'medium';
    };

    const parseSugar = (speech: string): 'low' | 'medium' | 'high' => {
        if (speech.includes('no sugar') || speech.includes('without sugar') || speech.includes('unsweetened')) return 'low';
        if (speech.includes('extra sugar') || speech.includes('very sweet')) return 'high';
        if (speech.includes('less sugar') || speech.includes('light sugar') || speech.includes('low sugar')) return 'low';
        return 'medium';
    };

    const parseToppings = (speech: string): number[] => {
        const toppingIds: number[] = [];

        TOPPINGS.forEach(topping => {
            const name = topping.name.toLowerCase();
            if (speech.includes(name)) {
                toppingIds.push(topping.id);
            }
        });

        // Handle common variations
        if (speech.includes('boba') || speech.includes('pearls') || speech.includes('tapioca')) {
            const boba = TOPPINGS.find(t => t.name.toLowerCase().includes('boba'));
            if (boba && !toppingIds.includes(boba.id)) toppingIds.push(boba.id);
        }

        return toppingIds;
    };

    const startListening = () => {
        if (!recognition) {
            setError('Speech recognition is not supported in this browser.');
            return;
        }

        setError('');
        setTranscript('');
        setLiveTranscript('');
        setParsedOrder(null);
        setIsListening(true);
        recognition.start();
    };

    const confirmOrder = () => {
        if (parsedOrder) {
            onAddToCart(parsedOrder);
            setShowConfirmation(false);
            setParsedOrder(null);
            setTranscript('');
        }
    };

    const cancelOrder = () => {
        setShowConfirmation(false);
        setParsedOrder(null);
        setTranscript('');
        setLiveTranscript('');
    };

    return (
        <>
            {/* Voice Order Button with Integrated Microphone Selector */}
            <div className="fixed top-4 right-52 z-[60]">
                <div className="flex items-center gap-1 bg-red-500 hover:bg-red-600 rounded-full shadow-lg transition-colors">
                    {/* Main Voice Button */}
                    <button
                        onClick={startListening}
                        disabled={isListening}
                        className={`p-3 rounded-l-full transition-colors ${isListening ? 'bg-red-600 animate-pulse' : ''
                            }`}
                        title={t('Voice Order')}
                        aria-label="Voice Order"
                    >
                        {isListening ? (
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        )}
                    </button>

                    {/* Dropdown Toggle */}
                    <button
                        onClick={() => setShowMicDropdown(!showMicDropdown)}
                        className="p-3 pr-4 rounded-r-full hover:bg-red-600 transition-colors border-l border-red-400"
                        title={t('Select Microphone')}
                        aria-label="Select Microphone"
                    >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                {/* Microphone Dropdown */}
                {showMicDropdown && availableMics.length > 0 && (
                    <div className="absolute top-14 right-0 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 min-w-[250px] max-h-60 overflow-y-auto z-[100]">
                        {availableMics.map((mic) => (
                            <button
                                key={mic.deviceId}
                                onClick={() => handleMicChange(mic.deviceId)}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors ${selectedMicId === mic.deviceId ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-800 dark:text-gray-200'
                                    }`}
                            >
                                {mic.label || `Microphone ${availableMics.indexOf(mic) + 1}`}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Voice Order Popup with Instructions and Live Transcription */}
            {isListening && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-white/20 p-6 max-w-lg w-full">
                        <h3 className="text-xl font-bold mb-4 gradient-text">{t('Order with Voice')}</h3>

                        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                                <strong>{t('Say something like:')}</strong>
                            </p>
                            <p className="text-sm italic text-blue-700 dark:text-blue-400">
                                "I want a taro milk tea large with extra sugar and ice and cherry and marshmallows"
                            </p>
                        </div>

                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('Listening...')}</span>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg min-h-[80px] border border-gray-200 dark:border-zinc-700">
                                {liveTranscript ? (
                                    <p className="text-base text-black dark:text-white italic">"{liveTranscript}"</p>
                                ) : (
                                    <p className="text-sm text-gray-400 dark:text-gray-500">{t('Start speaking...')}</p>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                recognition?.stop();
                                setIsListening(false);
                            }}
                            className="w-full px-4 py-2 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 rounded-lg transition-colors"
                        >
                            {t('Cancel')}
                        </button>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmation && parsedOrder && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-black/40" onClick={cancelOrder}></div>
                    <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl text-black dark:text-white border border-white/20">
                        <h3 className="text-xl font-bold mb-4 gradient-text">{t('Confirm Voice Order')}</h3>

                        <div className="mb-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('You said:')}</p>
                            <p className="italic">"{transcript}"</p>
                        </div>

                        <div className="mb-4">
                            <h4 className="font-semibold mb-2">{parsedOrder.name}</h4>
                            <div className="text-sm space-y-1">
                                <p><span className="text-gray-600 dark:text-gray-400">{t('Size')}:</span> {t(parsedOrder.custom?.size || 'regular')}</p>
                                <p><span className="text-gray-600 dark:text-gray-400">{t('Temperature')}:</span> {t(parsedOrder.custom?.temperature || 'cold')}</p>
                                <p><span className="text-gray-600 dark:text-gray-400">{t('Ice')}:</span> {t(parsedOrder.custom?.ice || 'medium')}</p>
                                <p><span className="text-gray-600 dark:text-gray-400">{t('Sugar')}:</span> {t(parsedOrder.custom?.sugar || 'medium')}</p>
                                {parsedOrder.custom?.toppings && parsedOrder.custom.toppings.length > 0 && (
                                    <p><span className="text-gray-600 dark:text-gray-400">{t('Toppings')}:</span> {parsedOrder.custom.toppings.map(id => TOPPINGS.find(t => t.id === id)?.name).join(', ')}</p>
                                )}
                            </div>
                            <p className="mt-3 text-lg font-bold gradient-text">${parsedOrder.price.toFixed(2)}</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={cancelOrder}
                                className="flex-1 px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all"
                            >
                                {t('Cancel')}
                            </button>
                            <button
                                onClick={confirmOrder}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white font-bold rounded-xl shadow-lg hover:shadow-primary/30 transition-all"
                            >
                                {t('Add to Cart')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
                    {error}
                </div>
            )}
        </>
    );
}
