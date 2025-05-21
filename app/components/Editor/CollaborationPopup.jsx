import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';

const CollaborationPopup = ({ onClose }) => {
  const [groupName, setGroupName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [members, setMembers] = useState([]);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const response = await fetch('/api/auth/user');
        const data = await response.json();
        setUserEmail(data.email);
      } catch (error) {
        toast.error('Failed to fetch user email');
      }
    };

    fetchUserEmail();
  }, []);

  const handleAddMember = () => {
    if (memberEmail && !members.includes(memberEmail)) {
      setMembers([...members, memberEmail]);
      setMemberEmail('');
    }
  };

  const handleRemoveMember = (email) => {
    setMembers(members.filter(m => m !== email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/collaboration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          groupName,
          members
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Collaboration group created successfully!');
        onClose();
      } else {
        throw new Error(data.message || 'Failed to create collaboration');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#262626] rounded-lg p-6 w-96 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-semibold text-white mb-4">Create Collaboration</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 bg-[#363636] text-white rounded focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
              required
              minLength={3}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Add Members</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#363636] text-white rounded focus:outline-none focus:ring-2 focus:ring-[#FFB800]"
                placeholder="Enter email address"
              />
              <button
                type="button"
                onClick={handleAddMember}
                className="px-4 py-2 bg-[#FFB800] text-black rounded hover:bg-[#E6A600]"
              >
                Add
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Members List</label>
            <div className="space-y-2">
              {members.map((email) => (
                <div key={email} className="flex justify-between items-center bg-[#363636] px-3 py-2 rounded">
                  <span className="text-white">{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(email)}
                    className="text-red-500 hover:text-red-400"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-[#FFB800] text-black rounded hover:bg-[#E6A600] font-semibold"
          >
            Create Collaboration
          </button>
        </form>
      </div>
    </div>
  );
};

export default CollaborationPopup;