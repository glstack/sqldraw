import { useCallback, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  addEdge
} from 'reactflow';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

import 'reactflow/dist/style.css';

const nodeStyles = {
  tableNode: {
    background: '#fff',
    border: '1px solid #555',
    borderRadius: '5px',
    padding: '10px'
  },
  tableHeader: {
    fontWeight: 'bold',
    marginBottom: '10px'
  },
  tableField: {
    position: 'relative',
    padding: '5px 0'
  }
};

const TableNode = ({ data }) => (
    <div style={nodeStyles.tableNode}>
      <div style={nodeStyles.tableHeader}>{data.tableName}</div>
      <div>
        {data.fields.map((field, index) => (
            <div key={field.name} style={nodeStyles.tableField}>
              <Handle
                  type="source"
                  position={Position.Right}
                  id={`${field.name}-source`}
                  style={{
                    top: `${10 + index * 20}px`,
                    background: '#555',
                    width: 8,
                    height: 8
                  }}
              />
              <Handle
                  type="target"
                  position={Position.Left}
                  id={`${field.name}-target`}
                  style={{
                    top: `${10 + index * 20}px`,
                    background: '#555',
                    width: 8,
                    height: 8
                  }}
              />
              <span>
            {field.name} ({field.type}) {field.isPrimaryKey && '🔑'}
          </span>
            </div>
        ))}
      </div>
    </div>
);

const EditTableForm = ({ node, onSave, onClose }) => {
  const [tableName, setTableName] = useState(node.data.tableName);
  const [fields, setFields] = useState(node.data.fields);

  const addField = () => {
    setFields([...fields, { name: '', type: 'string', isPrimaryKey: false }]);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index, field) => {
    const newFields = [...fields];
    newFields[index] = field;
    setFields(newFields);
  };

  const handleSave = () => {
    onSave({ ...node.data, tableName, fields });
  };

  return (
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4
      }}>
        <h3>Edit Table</h3>
        <div>
          <label>Table Name: </label>
          <input
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
          />
        </div>
        <div style={{ marginTop: '1rem' }}>
          {fields.map((field, index) => (
              <div key={index} style={{ marginBottom: '0.5rem' }}>
                <input
                    placeholder="Field name"
                    value={field.name}
                    onChange={(e) =>
                        updateField(index, { ...field, name: e.target.value })
                    }
                />
                <select
                    value={field.type}
                    onChange={(e) =>
                        updateField(index, { ...field, type: e.target.value })
                    }
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="date">Date</option>
                </select>
                <label>
                  <input
                      type="checkbox"
                      checked={field.isPrimaryKey}
                      onChange={(e) =>
                          updateField(index, { ...field, isPrimaryKey: e.target.checked })
                      }
                  />
                  Primary Key
                </label>
                <button onClick={() => removeField(index)}>🗑</button>
              </div>
          ))}
          <button onClick={addField}>Add Field</button>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </Box>
  );
};

const nodeTypes = { table: TableNode };

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  const onConnect = useCallback(
      (connection) => {
        const { sourceHandle, targetHandle, source, target } = connection;
        const sourceField = sourceHandle?.replace('-source', '');
        const targetField = targetHandle?.replace('-target', '');

        const newEdge = {
          ...connection,
          id: `edge-${source}-${target}-${Date.now()}`,
          data: { sourceField, targetField }
        };

        setEdges((eds) => addEdge(newEdge, eds));
      },
      [setEdges]
  );

  const addTable = () => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'table',
      data: {
        tableName: 'New Table',
        fields: [{ name: 'id', type: 'number', isPrimaryKey: true }]
      },
      position: { x: Math.random() * 400, y: Math.random() * 400 }
    };

    setNodes((nds) => nds.concat(newNode));
  };

  const saveSchema = () => {
    const schema = { nodes, edges };
    const data = JSON.stringify(schema, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadSchema = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const schema = JSON.parse(event.target.result);
        setNodes(schema.nodes || []);
        setEdges(schema.edges || []);
      } catch (error) {
        alert('Error loading schema file');
      }
    };
    reader.readAsText(file);
  };

  return (
      <div style={{ height: '100vh' }}>
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeDoubleClick={(e, node) => setSelectedNode(node)}
            fitView
        >
          <Controls />
          <MiniMap />
          <Background />
        </ReactFlow>

        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
          <button onClick={addTable} style={{ marginRight: '1rem' }}>
            Add Table
          </button>
          <button onClick={saveSchema} style={{ marginRight: '1rem' }}>
            Save Schema
          </button>
          <label>
            Load Schema
            <input type="file" onChange={loadSchema} accept=".json" hidden />
          </label>
        </div>

        <Modal open={!!selectedNode} onClose={() => setSelectedNode(null)}>
          <div>
            {selectedNode && (
                <EditTableForm
                    node={selectedNode}
                    onSave={(updatedData) => {
                      setNodes((nds) =>
                          nds.map((n) =>
                              n.id === selectedNode.id ? { ...n, data: updatedData } : n
                          )
                      );
                      setSelectedNode(null);
                    }}
                    onClose={() => setSelectedNode(null)}
                />
            )}
          </div>
        </Modal>
      </div>
  );
}