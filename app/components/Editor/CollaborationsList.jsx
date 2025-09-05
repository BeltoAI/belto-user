import React, { useEffect, useState } from 'react';
import { X, Users, File, Plus } from 'lucide-react';
import { toast } from 'react-toastify';

const CollaborationsList = ({ onClose, onDocumentSelect }) => {
    const [collaborations, setCollaborations] = useState([]);
    const [documents, setDocuments] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedCollaboration, setSelectedCollaboration] = useState(null);
    const [showNewDocumentForm, setShowNewDocumentForm] = useState(false);
    const [newDocTitle, setNewDocTitle] = useState('');

    useEffect(() => {
        const fetchCollaborations = async () => {
            try {
                const userResponse = await fetch('/api/auth/user');
                const userData = await userResponse.json();
                
                const response = await fetch(`/api/collaboration?email=${userData.email}`);
                const data = await response.json();
                
                if (response.ok) {
                    setCollaborations(data.data);
                    // Fetch documents for each collaboration
                    data.data.forEach(collab => fetchDocuments(collab._id, userData.email));
                }
            } catch (error) {
                console.error('Error fetching collaborations:', error);
            }
        };

        fetchCollaborations();
    }, []);

    const fetchDocuments = async (collaborationId, userEmail) => {
        try {
            const response = await fetch(`/api/collaborative-documents?collaborationId=${collaborationId}&userEmail=${userEmail}`);
            const data = await response.json();
            
            if (response.ok) {
                setDocuments(prev => ({
                    ...prev,
                    [collaborationId]: data.data
                }));
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };
        try {
            const response = await fetch(`/api/collaborative-documents?collaborationId=${collaborationId}&email=${userEmail}`);
            const data = await response.json();
            
            if (response.ok) {
                setDocuments(prev => ({
                    ...prev,
                    [collaborationId]: data.data
                }));
            }
        } catch (error) {
            toast.error(`Error fetching documents: ${error.message}`);
        }
    };

    const createNewDocument = async () => {
        try {
            const userResponse = await fetch('/api/auth/user');
            const userData = await userResponse.json();

            const response = await fetch('/api/collaborative-documents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: newDocTitle,
                    collaborationId: selectedCollaboration,
                    userEmail: userData.email,
                    content: '<h1>New Document</h1>'
                }),
            });

            const data = await response.json();
            
            if (response.ok) {
                toast.success('Document created successfully');
                fetchDocuments(selectedCollaboration, userData.email);
                setShowNewDocumentForm(false);
                setNewDocTitle('');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#262626] rounded-lg p-6 w-[600px] max-h-[80vh] relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <X size={20} />
                </button>

                <h2 className="text-xl font-semibold text-white mb-4">Your Collaborations</h2>

                {loading ? (
                    <div className="text-center text-white py-4">Loading...</div>
                ) : (
                    <div className="space-y-6">
                        {collaborations.map((collab) => (
                            <div key={collab._id} className="bg-[#363636] p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-white font-medium">{collab.groupName}</h3>
                                    <button
                                        onClick={() => {
                                            setSelectedCollaboration(collab._id);
                                            setShowNewDocumentForm(true);
                                        }}
                                        className="flex items-center gap-2 px-3 py-1 bg-[#FFB800] text-black rounded hover:bg-[#E6A600]"
                                    >
                                        <Plus size={16} />
                                        <span>New Document</span>
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {documents[collab._id]?.map((doc) => (
                                        <div
                                            key={doc._id}
                                            onClick={() => onDocumentSelect(doc)}
                                            className="flex items-center gap-2 p-2 hover:bg-[#404040] rounded cursor-pointer"
                                        >
                                            <File size={16} className="text-[#FFB800]" />
                                            <div>
                                                <div className="text-white">{doc.title}</div>
                                                <div className="text-xs text-gray-400">
                                                    Last edited by {doc.lastEditedBy} on {new Date(doc.lastEditedAt).toLocaleString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showNewDocumentForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-[#262626] p-6 rounded-lg w-96">
                            <h3 className="text-lg font-medium text-white mb-4">Create New Document</h3>
                            <input
                                type="text"
                                value={newDocTitle}
                                onChange={(e) => setNewDocTitle(e.target.value)}
                                placeholder="Document Title"
                                className="w-full px-3 py-2 bg-[#363636] text-white rounded mb-4"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowNewDocumentForm(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createNewDocument}
                                    className="px-4 py-2 bg-[#FFB800] text-black rounded hover:bg-[#E6A600]"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CollaborationsList;