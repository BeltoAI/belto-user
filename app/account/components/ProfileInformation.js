"use client";

import React, { useState, useEffect } from 'react';
import { Edit, Camera, Mail, Phone, Calendar, Users, Trophy, TrendingUp, Heart, ThumbsUp, ThumbsDown, Clock, User } from 'lucide-react';
import { toast } from 'react-toastify';
import Image from 'next/image';

const ProfileInformation = ({ user, onUserUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.username || '',
    username: user?.username || '',
    email: user?.email || '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    veterinarianStatus: '',
    disabilityStatus: '',
    ethnicity: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState('/user.png');
  const [userStats, setUserStats] = useState({
    totalPrompts: 0,
    totalLikes: 0,
    totalDislikes: 0,
    totalUsageHours: 0,
    sentimentAnalysis: {}
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch additional user profile data and stats
    const fetchUserStats = async () => {
      try {
        const response = await fetch(`/api/settings/profile-stats`);
        if (response.ok) {
          const stats = await response.json();
          setUserStats(stats);
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    // Fetch current profile data
    const fetchProfileData = async () => {
      try {
        const response = await fetch('/api/settings/profile');
        if (response.ok) {
          const profileData = await response.json();
          setFormData(prev => ({
            ...prev,
            ...profileData
          }));
          if (profileData.profileImage) {
            setPreviewImage(profileData.profileImage);
          }
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };

    fetchUserStats();
    fetchProfileData();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      // Add profile image if changed
      if (profileImage) {
        formDataToSend.append('profileImage', profileImage);
      }

      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        body: formDataToSend
      });

      if (response.ok) {
        const updatedUser = await response.json();
        onUserUpdate(updatedUser);
        setIsEditing(false);
        toast.success('Profile updated successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const renderSentimentAnalysis = () => {
    if (!userStats.sentimentAnalysis || Object.keys(userStats.sentimentAnalysis).length === 0) {
      return (
        <div className="text-gray-400 text-sm">
          No sentiment analysis data available yet
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {Object.entries(userStats.sentimentAnalysis).map(([className, sentiment]) => (
          <div key={className} className="bg-[#2a2a2a] p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium text-sm">{className}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                sentiment.overall === 'positive' ? 'bg-green-500/20 text-green-400' :
                sentiment.overall === 'negative' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {sentiment.overall}
              </span>
            </div>
            <div className="text-xs text-gray-400">
              Score: {sentiment.score}/10
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Profile & Personal Information</h2>
        <button
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          disabled={loading}
          className="bg-[#FFB800] text-black px-4 py-2 rounded-lg hover:bg-[#FFD700] transition-colors font-medium flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          {loading ? 'Saving...' : isEditing ? 'Save Profile' : 'Edit Profile'}
        </button>
      </div>

      {/* Profile Header */}
      <div className="bg-[#2a2a2a] p-6 rounded-lg mb-6 border border-[#444444]">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            <div className="relative w-32 h-32">
              <Image
                src={previewImage}
                alt="Profile Picture"
                width={128}
                height={128}
                className="w-32 h-32 rounded-full object-cover border-4 border-[#FFB800]"
              />
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-[#FFB800] p-2 rounded-full cursor-pointer hover:bg-[#FFD700] transition-colors">
                  <Camera className="w-4 h-4 text-black" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-white">{user?.username}</h3>
              <p className="text-[#FFB800]">{user?.email}</p>
              <p className="text-gray-400 text-sm mt-2">
                This picture will be used in chat conversations and throughout the platform
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#1f1f1f] p-3 rounded-lg border border-[#333333]">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-[#FFB800]" />
                  <span className="text-xs text-gray-400">Prompts</span>
                </div>
                <span className="text-lg font-semibold text-white">{userStats.totalPrompts}</span>
              </div>
              
              <div className="bg-[#1f1f1f] p-3 rounded-lg border border-[#333333]">
                <div className="flex items-center gap-2 mb-1">
                  <ThumbsUp className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-400">Likes</span>
                </div>
                <span className="text-lg font-semibold text-white">{userStats.totalLikes}</span>
              </div>
              
              <div className="bg-[#1f1f1f] p-3 rounded-lg border border-[#333333]">
                <div className="flex items-center gap-2 mb-1">
                  <ThumbsDown className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-gray-400">Dislikes</span>
                </div>
                <span className="text-lg font-semibold text-white">{userStats.totalDislikes}</span>
              </div>
              
              <div className="bg-[#1f1f1f] p-3 rounded-lg border border-[#333333]">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-400">Hours</span>
                </div>
                <span className="text-lg font-semibold text-white">{userStats.totalUsageHours}h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Full Name */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <User className="w-4 h-4" />
            Full Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#444444] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
              placeholder="Enter your full name"
            />
          ) : (
            <div className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#444444] rounded-lg text-white">
              {formData.fullName || 'Not specified'}
            </div>
          )}
        </div>

        {/* Username */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <Users className="w-4 h-4" />
            Username
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#444444] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
              placeholder="Enter your username"
            />
          ) : (
            <div className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#444444] rounded-lg text-white">
              {formData.username}
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <Mail className="w-4 h-4" />
            Email Address
          </label>
          <div className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#444444] rounded-lg text-gray-400">
            {formData.email}
            <span className="text-xs text-gray-500 block mt-1">Email cannot be changed</span>
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <Phone className="w-4 h-4" />
            Phone Number
          </label>
          {isEditing ? (
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#444444] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
              placeholder="Enter your phone number"
            />
          ) : (
            <div className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#444444] rounded-lg text-white">
              {formData.phoneNumber || 'Not specified'}
            </div>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <Calendar className="w-4 h-4" />
            Date of Birth
          </label>
          {isEditing ? (
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#444444] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
            />
          ) : (
            <div className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#444444] rounded-lg text-white">
              {formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString() : 'Not specified'}
            </div>
          )}
        </div>

        {/* Gender */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <span className="text-gray-400">(Optional)</span>
            Gender & Sex
          </label>
          {isEditing ? (
            <select
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#444444] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          ) : (
            <div className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#444444] rounded-lg text-white">
              {formData.gender || 'Not specified'}
            </div>
          )}
        </div>
      </div>

      {/* Optional Information */}
      <div className="bg-[#2a2a2a] p-6 rounded-lg mb-6 border border-[#444444]">
        <h3 className="text-lg font-semibold text-white mb-4">Optional Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Veterinarian Status */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Veterinarian Status
            </label>
            {isEditing ? (
              <select
                value={formData.veterinarianStatus}
                onChange={(e) => handleInputChange('veterinarianStatus', e.target.value)}
                className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#333333] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
              >
                <option value="">Select status</option>
                <option value="licensed-veterinarian">Licensed Veterinarian</option>
                <option value="veterinary-student">Veterinary Student</option>
                <option value="veterinary-technician">Veterinary Technician</option>
                <option value="not-veterinary">Not in Veterinary Field</option>
              </select>
            ) : (
              <div className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#333333] rounded-lg text-white">
                {formData.veterinarianStatus || 'Not specified'}
              </div>
            )}
          </div>

          {/* Disability Status */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Disability Status
            </label>
            {isEditing ? (
              <select
                value={formData.disabilityStatus}
                onChange={(e) => handleInputChange('disabilityStatus', e.target.value)}
                className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#333333] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
              >
                <option value="">Select status</option>
                <option value="no-disability">No Disability</option>
                <option value="has-disability">Has Disability</option>
                <option value="prefer-not-to-say">Prefer Not to Say</option>
              </select>
            ) : (
              <div className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#333333] rounded-lg text-white">
                {formData.disabilityStatus || 'Not specified'}
              </div>
            )}
          </div>

          {/* Ethnicity */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Ethnicity
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.ethnicity}
                onChange={(e) => handleInputChange('ethnicity', e.target.value)}
                className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#333333] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FFB800] focus:border-transparent"
                placeholder="Enter your ethnicity"
              />
            ) : (
              <div className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#333333] rounded-lg text-white">
                {formData.ethnicity || 'Not specified'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sentiment Analysis */}
      <div className="bg-[#2a2a2a] p-6 rounded-lg border border-[#444444]">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-[#FFB800]" />
          Sentiment Analysis by Class
        </h3>
        {renderSentimentAnalysis()}
      </div>

      {/* Cancel Button for Edit Mode */}
      {isEditing && (
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={() => {
              setIsEditing(false);
              setFormData({
                fullName: user?.username || '',
                username: user?.username || '',
                email: user?.email || '',
                phoneNumber: '',
                dateOfBirth: '',
                gender: '',
                veterinarianStatus: '',
                disabilityStatus: '',
                ethnicity: ''
              });
            }}
            className="px-4 py-2 border border-[#444444] text-gray-300 rounded-lg hover:bg-[#2a2a2a] transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileInformation;
