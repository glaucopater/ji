import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { TechniqueFlow } from '../../types/flow';

interface CreateTechniqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (technique: TechniqueFlow) => void;
  existingTechniques: TechniqueFlow[];
}

export function CreateTechniqueModal({ isOpen, onClose, onCreate, existingTechniques }: CreateTechniqueModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if name already exists
    if (existingTechniques.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      toast.error('A technique with this name already exists');
      return;
    }

    const newTechnique: TechniqueFlow = {
      id: Date.now().toString(),
      name,
      description,
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onCreate(newTechnique);
    setName('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create New Technique</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter technique name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter technique description"
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="create-button">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 