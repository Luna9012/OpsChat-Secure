import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { Briefcase, FileText, Loader2, MessageSquare, User } from 'lucide-react';
import axios from 'axios';

interface ViewProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string | number | null;
    onStartDM?: (userId: string | number) => void;
}

interface UserProfile {
    id: number;
    username: string;
    name: string;
    status: string;
    bio: string;
    avatar?: string;      
    avatarColor?: string; 
}

const ViewProfileModal: React.FC<ViewProfileModalProps> = ({ isOpen, onClose, userId, onStartDM }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId || !isOpen) return;

            setIsLoading(true);
            setError('');

            try {
                const currentUserId = localStorage.getItem('userId');
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
                    headers: { 'x-user-id': currentUserId }
                });
                setProfile(res.data);
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to load profile');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [userId, isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="User Profile">
            <div className="space-y-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                ) : error ? (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium text-center">
                        {error}
                    </div>
                ) : profile ? (
                    <>
                        {/* Profile Header with Avatar */}
                        <div className="flex items-center gap-5">
                            <div className={`w-20 h-20 rounded-[24px] flex items-center justify-center font-black text-2xl shadow-xl overflow-hidden transition-all ${profile.avatar ? '' : (profile.avatarColor || 'bg-[#b5f2a1]')
                                } ${profile.avatar ? '' : 'text-slate-900'}`}>
                                {profile.avatar ? (
                                    <img
                                        src={profile.avatar}
                                        alt={profile.username}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    profile.username?.[0]?.toUpperCase() || <User className="w-8 h-8" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
                                    {profile.name || profile.username}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                        @{profile.username}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {profile.status && (
                            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl">
                                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <Briefcase className="w-4 h-4 text-green-500" />
                                </div>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{profile.status}</span>
                            </div>
                        )}

                        {profile.bio && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                                    <FileText className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Transmission / Bio</span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/30">
                                    {profile.bio}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => {
                                    if (onStartDM && profile.id) {
                                        onStartDM(profile.id);
                                        onClose();
                                    }
                                }}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#b5f2a1] hover:bg-[#9de085] text-slate-900 font-black py-4 rounded-2xl transition-all shadow-lg shadow-[#b5f2a1]/20 group"
                            >
                                <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                <span>Initiate DM</span>
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-xs">
                        No profile data received
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ViewProfileModal;