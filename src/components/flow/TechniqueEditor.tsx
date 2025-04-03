import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
} from 'reactflow';
import { Toaster, toast } from 'react-hot-toast';
import 'reactflow/dist/style.css';
import './TechniqueEditor.css';
import { MovementNode } from './MovementNode';
import { MovementNodeEditor } from './MovementNodeEditor';
import { CreateTechniqueModal } from './CreateTechniqueModal';
import { FlowNode, TechniqueFlow, MovementData } from '../../types/flow';
import { TabPanel } from '../TabPanel';
import { Position } from '../../types/positions';

const nodeTypes = {
  movement: MovementNode,
};

export function TechniqueEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState<MovementData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [savedTechniques, setSavedTechniques] = useState<TechniqueFlow[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentTechnique, setCurrentTechnique] = useState<TechniqueFlow | null>(null);

  // Load saved techniques on mount
  useEffect(() => {
    const loadTechniques = () => {
      const existingTechniques = localStorage.getItem('techniques');
      if (existingTechniques) {
        try {
          const parsed = JSON.parse(existingTechniques);
          setSavedTechniques(Array.isArray(parsed) ? parsed : []);
        } catch (error) {
          console.error('Error loading techniques:', error);
          setSavedTechniques([]);
        }
      } else {
        setSavedTechniques([]);
      }
    };
    loadTechniques();
  }, []);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addMovementNode = useCallback(() => {
    if (!currentTechnique) {
      toast.error('Please create or select a technique first');
      return;
    }

    const newNode = {
      id: `node-${Date.now()}`,
      type: 'movement',
      position: { x: 100, y: 100 },
      data: {
        limb: 'upperArmLeft',
        movementType: 'moveForward',
        position: { x: 0, y: 0, z: 0 },
        duration: 1,
        force: 1
      }
    } as FlowNode;
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes, currentTechnique]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node as FlowNode);
  }, []);

  const handleNodeDataChange = useCallback((nodeId: string, newData: MovementData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: newData,
          } as FlowNode;
        }
        return node;
      })
    );
  }, [setNodes]);

  const handleCreateTechnique = useCallback((technique: TechniqueFlow) => {
    setSelectedNode(null);
    setCurrentTechnique(technique);
    // Force a clean slate for nodes and edges
    setNodes([]);
    setEdges([]);
    // Save after state is cleared
    setTimeout(() => saveTechnique(technique), 0);
  }, []);

  const saveTechnique = (technique: TechniqueFlow) => {
    // Get existing techniques from localStorage
    const existingTechniques = localStorage.getItem('techniques');
    let techniques: TechniqueFlow[] = [];
    
    try {
      if (existingTechniques) {
        const parsed = JSON.parse(existingTechniques);
        techniques = Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.error('Error parsing techniques:', error);
      techniques = [];
    }
    
    // Add or update technique
    const existingIndex = techniques.findIndex(t => t.id === technique.id);
    if (existingIndex >= 0) {
      techniques[existingIndex] = {
        ...technique,
        nodes,
        edges,
        updatedAt: new Date().toISOString()
      };
    } else {
      techniques.push({
        ...technique,
        nodes,
        edges,
        updatedAt: new Date().toISOString()
      });
    }
    
    // Save back to localStorage
    localStorage.setItem('techniques', JSON.stringify(techniques));
    
    // Update state
    setSavedTechniques(techniques);
    toast.success('Technique saved successfully!');
  };

  const loadTechnique = useCallback((technique: TechniqueFlow) => {
    setSelectedNode(null);
    setCurrentTechnique(technique);
    setNodes(technique.nodes || []);
    setEdges(technique.edges || []);
  }, []);

  useEffect(() => {
    setSelectedNode(null);
  }, [currentTechnique]);

  const deleteTechnique = (techniqueId: string) => {
    const updatedTechniques = savedTechniques.filter(t => t.id !== techniqueId);
    localStorage.setItem('techniques', JSON.stringify(updatedTechniques));
    setSavedTechniques(updatedTechniques);
    
    if (currentTechnique?.id === techniqueId) {
      setCurrentTechnique(null);
      setNodes([]);
      setEdges([]);
    }
    
    toast.success('Technique deleted successfully!');
  };

  const exportTechnique = useCallback(() => {
    if (!currentTechnique) {
      toast.error('Please create or select a technique first');
      return;
    }

    const technique: TechniqueFlow = {
      ...currentTechnique,
      nodes,
      edges,
      updatedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(technique, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${currentTechnique.name.toLowerCase().replace(/\s+/g, '-')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [currentTechnique, nodes, edges]);

  const handlePositionSelect = (position: Position) => {
    // This will be handled by the parent component
    console.log('Position selected:', position);
  };

  return (
    <div className="technique-editor">
      <Toaster position="top-right" />
      <div className="editor-controls">
        <button onClick={() => setIsCreateModalOpen(true)} className="create-button">
          Create New Technique
        </button>
        <button onClick={exportTechnique} style={{ backgroundColor: "#2196F3", color: "white" }}>
          Export Techniques
        </button>
        {currentTechnique && (
          <>
            <button onClick={addMovementNode}>Add Movement</button>
            <button onClick={() => saveTechnique(currentTechnique)}>Save Changes</button>
          </>
        )}
      </div>

      <div className="editor-container">
        <div className="editor-sidebar">
          <TabPanel onPositionSelect={handlePositionSelect}>
            <div className="saved-techniques">
              <h3>Saved Techniques</h3>
              {savedTechniques.map((technique) => (
                <div 
                  key={technique.id} 
                  className={`saved-technique-item ${currentTechnique?.id === technique.id ? 'active' : ''}`}
                  onClick={() => loadTechnique(technique)}
                >
                  <div>
                    <h4>{technique.name}</h4>
                    <p>{technique.description}</p>
                    <small style={{ color: '#666', fontSize: '0.8em' }}>
                      Last updated: {new Date(technique.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </small>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTechnique(technique.id);
                    }}
                    style={{ marginLeft: 'auto' }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <div className="positions-tab">
              <h3>Positions</h3>
              <p>Select a position to use as reference</p>
            </div>
          </TabPanel>
        </div>

        <div className="flow-container">
          {currentTechnique ? (
            <ReactFlow
              key={currentTechnique.id}
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={handleNodeClick}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          ) : (
            <div className="no-technique-selected">
              <p>Select a technique or create a new one to start editing</p>
            </div>
          )}
        </div>

        {selectedNode && (
          <div className="node-editor-panel">
            <div className="panel-header">
              <h3>Edit Movement</h3>
              <button onClick={(e) => {
                e.stopPropagation();
                setSelectedNode(null);
              }}>×</button>
            </div>
            <MovementNodeEditor
              data={selectedNode.data}
              onChange={(newData) => handleNodeDataChange(selectedNode.id, newData)}
            />
          </div>
        )}
      </div>

      <CreateTechniqueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateTechnique}
        existingTechniques={savedTechniques}
      />
    </div>
  );
} 