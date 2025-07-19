"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Trash2, Edit2, Save, X, Bot, MessageSquare, Settings } from 'lucide-react';

const AIPreferencesSection = ({ user }) => {
  const [aiPreferences, setAiPreferences] = useState({
    preRules: [],
    postRules: [],
    personalityTone: 'friendly',
    customTone: '',
    enablePersonalization: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [newRule, setNewRule] = useState({ type: '', name: '', content: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchAIPreferences();
  }, []);

  const fetchAIPreferences = async () => {
    try {
      const response = await fetch('/api/auth/ai-preferences');
      if (response.ok) {
        const data = await response.json();
        setAiPreferences(data.aiPreferences || {
          preRules: [],
          postRules: [],
          personalityTone: 'friendly',
          customTone: '',
          enablePersonalization: true
        });
      }
    } catch (error) {
      console.error('Error fetching AI preferences:', error);
      toast.error('Failed to load AI preferences');
    } finally {
      setLoading(false);
    }
  };

  const saveAIPreferences = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/auth/ai-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiPreferences })
      });

      if (response.ok) {
        toast.success('AI preferences saved successfully');
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving AI preferences:', error);
      toast.error('Failed to save AI preferences');
    } finally {
      setSaving(false);
    }
  };

  const addRule = () => {
    if (!newRule.name.trim() || !newRule.content.trim() || !newRule.type) {
      toast.error('Please fill in all fields');
      return;
    }

    const rule = {
      name: newRule.name,
      content: newRule.content,
      enabled: true
    };

    if (newRule.type === 'pre') {
      setAiPreferences(prev => ({
        ...prev,
        preRules: [...prev.preRules, rule]
      }));
    } else {
      setAiPreferences(prev => ({
        ...prev,
        postRules: [...prev.postRules, rule]
      }));
    }

    setNewRule({ type: '', name: '', content: '' });
    setShowAddForm(false);
    toast.success('Rule added successfully');
  };

  const updateRule = (type, index, updatedRule) => {
    if (type === 'pre') {
      setAiPreferences(prev => ({
        ...prev,
        preRules: prev.preRules.map((rule, i) => i === index ? updatedRule : rule)
      }));
    } else {
      setAiPreferences(prev => ({
        ...prev,
        postRules: prev.postRules.map((rule, i) => i === index ? updatedRule : rule)
      }));
    }
    setEditingRule(null);
  };

  const deleteRule = (type, index) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      if (type === 'pre') {
        setAiPreferences(prev => ({
          ...prev,
          preRules: prev.preRules.filter((_, i) => i !== index)
        }));
      } else {
        setAiPreferences(prev => ({
          ...prev,
          postRules: prev.postRules.filter((_, i) => i !== index)
        }));
      }
      toast.success('Rule deleted successfully');
    }
  };

  const toggleRule = (type, index) => {
    if (type === 'pre') {
      setAiPreferences(prev => ({
        ...prev,
        preRules: prev.preRules.map((rule, i) => 
          i === index ? { ...rule, enabled: !rule.enabled } : rule
        )
      }));
    } else {
      setAiPreferences(prev => ({
        ...prev,
        postRules: prev.postRules.map((rule, i) => 
          i === index ? { ...rule, enabled: !rule.enabled } : rule
        )
      }));
    }
  };

  const renderRule = (rule, type, index) => {
    const isEditing = editingRule === `${type}-${index}`;

    return (
      <div key={index} className={`p-4 rounded-lg border ${rule.enabled ? 'border-gray-600 bg-gray-800' : 'border-gray-700 bg-gray-900'}`}>
        {isEditing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={rule.name}
              onChange={(e) => {
                const updatedRule = { ...rule, name: e.target.value };
                if (type === 'pre') {
                  setAiPreferences(prev => ({
                    ...prev,
                    preRules: prev.preRules.map((r, i) => i === index ? updatedRule : r)
                  }));
                } else {
                  setAiPreferences(prev => ({
                    ...prev,
                    postRules: prev.postRules.map((r, i) => i === index ? updatedRule : r)
                  }));
                }
              }}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              placeholder="Rule name"
            />
            <textarea
              value={rule.content}
              onChange={(e) => {
                const updatedRule = { ...rule, content: e.target.value };
                if (type === 'pre') {
                  setAiPreferences(prev => ({
                    ...prev,
                    preRules: prev.preRules.map((r, i) => i === index ? updatedRule : r)
                  }));
                } else {
                  setAiPreferences(prev => ({
                    ...prev,
                    postRules: prev.postRules.map((r, i) => i === index ? updatedRule : r)
                  }));
                }
              }}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white h-24"
              placeholder="Rule content"
            />
            <div className="flex gap-2">
              <button
                onClick={() => updateRule(type, index, rule)}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-sm"
              >
                <Save className="w-4 h-4 inline mr-1" />
                Save
              </button>
              <button
                onClick={() => setEditingRule(null)}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded-md text-sm"
              >
                <X className="w-4 h-4 inline mr-1" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <h4 className={`font-medium ${rule.enabled ? 'text-white' : 'text-gray-400'}`}>
                {rule.name}
              </h4>
              <div className="flex items-center gap-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => toggleRule(type, index)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full ${rule.enabled ? 'bg-blue-600' : 'bg-gray-600'} relative transition-colors`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${rule.enabled ? 'translate-x-5' : 'translate-x-1'}`}></div>
                  </div>
                </label>
                <button
                  onClick={() => setEditingRule(`${type}-${index}`)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteRule(type, index)}
                  className="p-1 text-gray-400 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className={`text-sm ${rule.enabled ? 'text-gray-300' : 'text-gray-500'}`}>
              {rule.content}
            </p>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="w-6 h-6 text-yellow-500" />
        <h2 className="text-2xl font-bold text-white">AI Preferences</h2>
      </div>

      {/* Personalization Settings */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Personalization Settings
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white font-medium">Enable AI Personalization</label>
              <p className="text-sm text-gray-400">Allow AI to adapt responses based on your preferences</p>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={aiPreferences.enablePersonalization}
                onChange={(e) => setAiPreferences(prev => ({
                  ...prev,
                  enablePersonalization: e.target.checked
                }))}
                className="sr-only"
              />
              <div className={`w-10 h-6 rounded-full ${aiPreferences.enablePersonalization ? 'bg-blue-600' : 'bg-gray-600'} relative transition-colors`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${aiPreferences.enablePersonalization ? 'translate-x-5' : 'translate-x-1'}`}></div>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Personality Tone</label>
            <select
              value={aiPreferences.personalityTone}
              onChange={(e) => setAiPreferences(prev => ({
                ...prev,
                personalityTone: e.target.value
              }))}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="casual">Casual</option>
              <option value="academic">Academic</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {aiPreferences.personalityTone === 'custom' && (
            <div>
              <label className="block text-white font-medium mb-2">Custom Tone Description</label>
              <textarea
                value={aiPreferences.customTone}
                onChange={(e) => setAiPreferences(prev => ({
                  ...prev,
                  customTone: e.target.value
                }))}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white h-20"
                placeholder="Describe how you want the AI to communicate with you..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Pre-Rules Section */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Pre-Rules (Before AI Response)
          </h3>
          <button
            onClick={() => {
              setNewRule({ type: 'pre', name: '', content: '' });
              setShowAddForm(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Pre-Rule
          </button>
        </div>
        
        <p className="text-gray-400 text-sm mb-4">
          Pre-rules are applied before the AI generates a response. These help set context and guidelines.
        </p>

        <div className="space-y-3">
          {aiPreferences.preRules.map((rule, index) => renderRule(rule, 'pre', index))}
          {aiPreferences.preRules.length === 0 && (
            <p className="text-gray-500 text-center py-4">No pre-rules defined</p>
          )}
        </div>
      </div>

      {/* Post-Rules Section */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Post-Rules (After AI Response)
          </h3>
          <button
            onClick={() => {
              setNewRule({ type: 'post', name: '', content: '' });
              setShowAddForm(true);
            }}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Post-Rule
          </button>
        </div>
        
        <p className="text-gray-400 text-sm mb-4">
          Post-rules are applied after the AI generates a response. These help refine and format the output.
        </p>

        <div className="space-y-3">
          {aiPreferences.postRules.map((rule, index) => renderRule(rule, 'post', index))}
          {aiPreferences.postRules.length === 0 && (
            <p className="text-gray-500 text-center py-4">No post-rules defined</p>
          )}
        </div>
      </div>

      {/* Add Rule Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              Add New {newRule.type === 'pre' ? 'Pre-Rule' : 'Post-Rule'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Rule Name</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white"
                  placeholder="Enter rule name"
                />
              </div>
              
              <div>
                <label className="block text-white font-medium mb-2">Rule Content</label>
                <textarea
                  value={newRule.content}
                  onChange={(e) => setNewRule(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white h-24"
                  placeholder="Enter rule description or instruction"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={addRule}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Add Rule
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewRule({ type: '', name: '', content: '' });
                  }}
                  className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveAIPreferences}
          disabled={saving}
          className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save AI Preferences'}
        </button>
      </div>
    </div>
  );
};

export default AIPreferencesSection;
