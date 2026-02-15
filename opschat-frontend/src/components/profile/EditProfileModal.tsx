import React, { useState, useRef } from 'react';
import Modal from '../ui/Modal';
import { InputField } from '../ui/InputField';
import { User, FileText, Loader2, Save, Briefcase, Camera, Upload, Check } from 'lucide-react';
import axios from 'axios';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: {
        username: string;
        name: string;
        status: string;
        bio: string;
        avatar?: string;
        avatarColor?: string;
    };
    onSuccess: (updatedUser: any) => void;
}

const AVATAR_COLORS = [
    { id: 1, color: 'bg-blue-400' },
    { id: 2, color: 'bg-purple-400' },
    { id: 3, color: 'bg-pink-400' },
    { id: 4, color: 'bg-orange-400' },
    { id: 5, color: 'bg-indigo-400' },
    { id: 6, color: 'bg-[#b5f2a1]' },
];

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, currentUser, onSuccess }) => {
    const [name, setName] = useState(currentUser.name || '');
    const [status, setStatus] = useState(currentUser.status || '');
    const [bio, setBio] = useState(currentUser.bio || '');
    const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar || '');
    const [avatarColor, setAvatarColor] = useState(currentUser.avatarColor || 'bg-blue-400');

    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const API_URL = import.meta.env.VITE_API_URL || "";

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError('');
        try {
            const userId = localStorage.getItem('userId');
            const formData = new FormData();
            formData.append('avatar', file);

            const res = await axios.post(`${API_URL}/api/users/upload-avatar`,
                formData,
                {
                    headers: {
                        'x-user-id': userId,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setAvatarUrl(res.data.publicUrl);
        } catch (err: any) {
            setError('Failed to upload image.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const userId = localStorage.getItem('userId');
            const res = await axios.put(`${API_URL}/api/users/profile`, {
                name,
                status,
                bio,
                avatar: avatarUrl,
                avatarColor
            }, {
                headers: { 'x-user-id': userId }
            });

            onSuccess(res.data);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
            <form onSubmit={handleSubmit} className="space-y-6">

                <div className="flex flex-col items-center mb-8">
                    <div className={`w-24 h-24 rounded-full mb-4 flex items-center justify-center text-3xl font-black border-4 border-white dark:border-slate-700 shadow-xl overflow-hidden transition-all ${avatarUrl ? '' : avatarColor
                        }`}>
                        {avatarUrl ? (
                            <img src={avatarUrl} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                            currentUser.username?.[0]?.toUpperCase() || <Camera className="w-8 h-8" />
                        )}
                    </div>

                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

                    <div className="flex flex-col items-center gap-4">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-widest disabled:opacity-50"
                        >
                            {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                            {avatarUrl ? 'Change Photo' : 'Upload Custom Photo'}
                        </button>

                        <div className="flex gap-2">
                            {AVATAR_COLORS.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                        setAvatarColor(c.color);
                                        setAvatarUrl(''); // Remove image if color is explicitly picked
                                    }}
                                    className={`w-6 h-6 rounded-lg transition-all relative ${c.color} ${avatarColor === c.color && !avatarUrl ? 'ring-2 ring-[#b5f2a1] ring-offset-2 dark:ring-offset-slate-800 scale-110' : 'hover:scale-105'}`}
                                >
                                    {avatarColor === c.color && !avatarUrl && <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <InputField
                    icon={User}
                    label="FULL NAME"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <InputField
                    icon={Briefcase}
                    label="STATUS"
                    placeholder="e.g. DevOps Engineer, AI Lead"
                    value={status}
                    onChange={(e) => setStatus(e.target.value.slice(0, 60))}
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 -mt-4 ml-1">
                    A short title displayed below your name ({status.length}/60)
                </p>

                <div className="space-y-2 group">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                        BIO
                    </label>
                    <div className="relative">
                        <div className="absolute left-4 top-4 text-slate-400 dark:text-slate-500 group-focus-within:text-[#b5f2a1] transition-colors">
                            <FileText className="w-4 h-4" />
                        </div>
                        <textarea
                            rows={3}
                            value={bio}
                            onChange={(e) => setBio(e.target.value.slice(0, 500))}
                            placeholder="Tell us more about yourself..."
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#b5f2a1] focus:ring-4 focus:ring-[#b5f2a1]/10 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none"
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading || isUploading}
                    className="w-full bg-[#b5f2a1] hover:bg-[#9de085] disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-4 rounded-2xl transition-all flex items-center justify-center space-x-2"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <span>Save Changes</span>
                            <Save className="w-5 h-5" />
                        </>
                    )}
                </button>
            </form>
        </Modal>
    );
};

export default EditProfileModal;