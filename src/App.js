import { useState, useCallback } from 'react';
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
import {
    Button,
    Modal,
    Form,
    Input,
    Select,
    Checkbox,
    Space,
    Card,
    Upload,
    message
} from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import 'reactflow/dist/style.css';
import 'antd/dist/reset.css';

const { Option } = Select;

const nodeStyles = {
    tableNode: {
        background: '#fff',
        border: '1px solid #d9d9d9',
        borderRadius: '8px',
        padding: '16px',
        width: '250px'
    },
    tableHeader: {
        fontSize: '16px',
        fontWeight: '600',
        marginBottom: '12px',
        color: '#1890ff'
    },
    tableField: {
        position: 'relative',
        padding: '8px 0',
        borderBottom: '1px solid #f0f0f0'
    }
};

const TableNode = ({ data }) => (
    <Card
        title={data.tableName}
        headStyle={{ backgroundColor: '#fafafa' }}
        style={nodeStyles.tableNode}
        bodyStyle={{ padding: '8px 0' }}
    >
        {data.fields.map((field, index) => (
            <div key={field.name} style={nodeStyles.tableField}>
                <Handle
                    type="source"
                    position={Position.Right}
                    id={`${field.name}-source`}
                    style={{
                        top: `${10 + index * 30}px`,
                        background: '#1890ff',
                        width: 10,
                        height: 10
                    }}
                />
                <Handle
                    type="target"
                    position={Position.Left}
                    id={`${field.name}-target`}
                    style={{
                        top: `${10 + index * 30}px`,
                        background: '#1890ff',
                        width: 10,
                        height: 10
                    }}
                />
                <Space>
                    <span>{field.name}</span>
                    <span style={{ color: '#666' }}>({field.type})</span>
                    {field.isPrimaryKey && <span style={{ color: '#52c41a' }}>🔑</span>}
                </Space>
            </div>
        ))}
    </Card>
);

const EditTableForm = ({ node, onSave, onCancel }) => {
    const [form] = Form.useForm();
    const [fields, setFields] = useState(node.data.fields);

    const handleSave = () => {
        form.validateFields().then(values => {
            onSave({
                ...node.data,
                tableName: values.tableName,
                fields: fields.map((field, index) => ({
                    ...field,
                    name: values[`fieldName${index}`],
                    type: values[`fieldType${index}`],
                    isPrimaryKey: values[`isPrimaryKey${index}`] || false
                }))
            });
        });
    };

    return (
        <Modal
            title="Edit Table"
            open={true}
            onOk={handleSave}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Cancel
                </Button>,
                <Button key="save" type="primary" onClick={handleSave}>
                    Save
                </Button>,
            ]}
        >
            <Form form={form} initialValues={{ tableName: node.data.tableName }}>
                <Form.Item
                    label="Table Name"
                    name="tableName"
                    rules={[{ required: true, message: 'Please input table name!' }]}
                >
                    <Input />
                </Form.Item>

                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {fields.map((field, index) => (
                        <Card
                            key={index}
                            style={{ marginBottom: '16px' }}
                            title={`Field ${index + 1}`}
                            extra={
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => setFields(fields.filter((_, i) => i !== index))}
                                />
                            }
                        >
                            <Form.Item
                                label="Field Name"
                                name={`fieldName${index}`}
                                initialValue={field.name}
                                rules={[{ required: true, message: 'Please input field name!' }]}
                            >
                                <Input />
                            </Form.Item>

                            <Form.Item
                                label="Field Type"
                                name={`fieldType${index}`}
                                initialValue={field.type}
                            >
                                <Select>
                                    <Option value="string">String</Option>
                                    <Option value="number">Number</Option>
                                    <Option value="boolean">Boolean</Option>
                                    <Option value="date">Date</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name={`isPrimaryKey${index}`}
                                valuePropName="checked"
                                initialValue={field.isPrimaryKey}
                            >
                                <Checkbox>Primary Key</Checkbox>
                            </Form.Item>
                        </Card>
                    ))}
                </div>

                <Button
                    type="dashed"
                    block
                    icon={<PlusOutlined />}
                    onClick={() => setFields([...fields, { name: '', type: 'string', isPrimaryKey: false }])}
                >
                    Add Field
                </Button>
            </Form>
        </Modal>
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
        message.success('Schema saved successfully');
    };

    const loadSchema = (file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const schema = JSON.parse(event.target.result);
                setNodes(schema.nodes || []);
                setEdges(schema.edges || []);
                message.success('Schema loaded successfully');
            } catch (error) {
                message.error('Error loading schema file');
            }
        };
        reader.readAsText(file);
        return false;
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

            <Space
                style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    zIndex: 1000,
                    background: '#fff',
                    padding: '8px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
            >
                <Button type="primary" icon={<PlusOutlined />} onClick={addTable}>
                    Add Table
                </Button>

                <Button icon={<SaveOutlined />} onClick={saveSchema}>
                    Save Schema
                </Button>

                <Upload
                    accept=".json"
                    showUploadList={false}
                    beforeUpload={loadSchema}
                >
                    <Button icon={<UploadOutlined />}>
                        Load Schema
                    </Button>
                </Upload>
            </Space>

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
                    onCancel={() => setSelectedNode(null)}
                />
            )}
        </div>
    );
}