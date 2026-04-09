"use client";

import { useState, useCallback, useMemo } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    addEdge,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
    type Connection,
    type NodeTypes,
    type Node,
    type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import { Network, Play, RotateCcw, Plus } from "lucide-react";
import { useProgress } from "@/lib/gamification";

// ─── Custom Node Components ───

function ReagentNode({ data }: { data: { label: string } }) {
    return (
        <div className="px-4 py-2 rounded-xl bg-brand-cyan/20 border-2 border-brand-cyan/50 text-brand-cyan font-bold text-sm shadow-lg shadow-brand-cyan/10 min-w-[100px] text-center">
            <Handle type="source" position={Position.Right} className="!bg-brand-cyan !w-3 !h-3 !border-2 !border-brand-dark" />
            <Handle type="target" position={Position.Left} className="!bg-brand-cyan !w-3 !h-3 !border-2 !border-brand-dark" />
            <div className="text-[9px] text-brand-cyan/60 uppercase tracking-wider mb-0.5">Reagentas</div>
            {data.label}
        </div>
    );
}

function ProductNode({ data }: { data: { label: string } }) {
    return (
        <div className="px-4 py-2 rounded-xl bg-brand-green/20 border-2 border-brand-green/50 text-brand-green font-bold text-sm shadow-lg shadow-brand-green/10 min-w-[100px] text-center">
            <Handle type="target" position={Position.Left} className="!bg-brand-green !w-3 !h-3 !border-2 !border-brand-dark" />
            <Handle type="source" position={Position.Right} className="!bg-brand-green !w-3 !h-3 !border-2 !border-brand-dark" />
            <div className="text-[9px] text-brand-green/60 uppercase tracking-wider mb-0.5">Produktas</div>
            {data.label}
        </div>
    );
}

function IntermediateNode({ data }: { data: { label: string } }) {
    return (
        <div className="px-4 py-2 rounded-xl bg-amber-400/20 border-2 border-amber-400/50 text-amber-400 font-bold text-sm shadow-lg shadow-amber-400/10 min-w-[100px] text-center">
            <Handle type="target" position={Position.Left} className="!bg-amber-400 !w-3 !h-3 !border-2 !border-brand-dark" />
            <Handle type="source" position={Position.Right} className="!bg-amber-400 !w-3 !h-3 !border-2 !border-brand-dark" />
            <div className="text-[9px] text-amber-400/60 uppercase tracking-wider mb-0.5">Tarpinis</div>
            {data.label}
        </div>
    );
}

const nodeTypes: NodeTypes = {
    reagent: ReagentNode,
    product: ProductNode,
    intermediate: IntermediateNode,
};

// ─── Templates ───

interface Template {
    name: string;
    description: string;
    nodes: Node[];
    edges: Edge[];
}

const TEMPLATES: Template[] = [
    {
        name: "Vienos stadijos",
        description: "A + B → C",
        nodes: [
            { id: "r1", type: "reagent", position: { x: 50, y: 80 }, data: { label: "A" } },
            { id: "r2", type: "reagent", position: { x: 50, y: 180 }, data: { label: "B" } },
            { id: "p1", type: "product", position: { x: 350, y: 130 }, data: { label: "C" } },
        ],
        edges: [
            { id: "e1", source: "r1", target: "p1", label: "k = 0.15", animated: true, style: { stroke: "#06b6d4" } },
            { id: "e2", source: "r2", target: "p1", label: "k = 0.15", animated: true, style: { stroke: "#06b6d4" } },
        ],
    },
    {
        name: "Dviejų stadijų",
        description: "A → X → B",
        nodes: [
            { id: "r1", type: "reagent", position: { x: 50, y: 120 }, data: { label: "A" } },
            { id: "i1", type: "intermediate", position: { x: 250, y: 120 }, data: { label: "X" } },
            { id: "p1", type: "product", position: { x: 450, y: 120 }, data: { label: "B" } },
        ],
        edges: [
            { id: "e1", source: "r1", target: "i1", label: "k₁ = 0.20", animated: true, style: { stroke: "#06b6d4" } },
            { id: "e2", source: "i1", target: "p1", label: "k₂ = 0.08", animated: true, style: { stroke: "#f59e0b" } },
        ],
    },
    {
        name: "Katalitinis ciklas",
        description: "A + Kat → B + Kat",
        nodes: [
            { id: "r1", type: "reagent", position: { x: 50, y: 80 }, data: { label: "A" } },
            { id: "i1", type: "intermediate", position: { x: 230, y: 20 }, data: { label: "Kat" } },
            { id: "i2", type: "intermediate", position: { x: 230, y: 200 }, data: { label: "A·Kat" } },
            { id: "p1", type: "product", position: { x: 430, y: 80 }, data: { label: "B" } },
        ],
        edges: [
            { id: "e1", source: "r1", target: "i2", label: "k₁", animated: true, style: { stroke: "#06b6d4" } },
            { id: "e2", source: "i1", target: "i2", label: "adsorbcija", animated: true, style: { stroke: "#f59e0b" } },
            { id: "e3", source: "i2", target: "p1", label: "k₂", animated: true, style: { stroke: "#22c55e" } },
            { id: "e4", source: "i2", target: "i1", label: "regeneracija", animated: false, style: { stroke: "#f59e0b", strokeDasharray: "5 5" } },
        ],
    },
];

// ─── Main Component ───

export default function ReactionBuilder() {
    const { completeActivity } = useProgress();
    const [nodes, setNodes, onNodesChange] = useNodesState(TEMPLATES[0].nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(TEMPLATES[0].edges);
    const [activeTemplate, setActiveTemplate] = useState(0);
    const [isSimulating, setIsSimulating] = useState(false);
    const [hasBuilt, setHasBuilt] = useState(false);
    const [nodeCounter, setNodeCounter] = useState(10);

    const onConnect = useCallback((connection: Connection) => {
        setEdges((eds) => addEdge({
            ...connection,
            animated: true,
            label: "k = 0.10",
            style: { stroke: "#64748b" },
        }, eds));

        if (!hasBuilt) {
            setHasBuilt(true);
            completeActivity("kinetika", 20);
        }
    }, [setEdges, hasBuilt, completeActivity]);

    const loadTemplate = (idx: number) => {
        setActiveTemplate(idx);
        setNodes(TEMPLATES[idx].nodes);
        setEdges(TEMPLATES[idx].edges);
        setIsSimulating(false);
    };

    const addNode = (type: "reagent" | "product" | "intermediate") => {
        const id = `custom-${nodeCounter}`;
        setNodeCounter((c) => c + 1);
        const labels = { reagent: "R", product: "P", intermediate: "X" };
        const newNode: Node = {
            id,
            type,
            position: { x: 200 + Math.random() * 100, y: 100 + Math.random() * 100 },
            data: { label: `${labels[type]}${nodeCounter}` },
        };
        setNodes((nds) => [...nds, newNode]);
    };

    const simulate = async () => {
        setIsSimulating(true);

        // Simple animation: highlight nodes sequentially along edges
        const visited = new Set<string>();
        const queue: string[] = [];

        // Find starting nodes (no incoming edges)
        const targetIds = new Set(edges.map((e) => e.target));
        nodes.forEach((n) => {
            if (!targetIds.has(n.id)) queue.push(n.id);
        });

        const highlightNode = (nodeId: string) => {
            setNodes((nds) =>
                nds.map((n) =>
                    n.id === nodeId
                        ? { ...n, style: { ...n.style, boxShadow: "0 0 20px rgba(255,255,255,0.5)", transform: "scale(1.1)" } }
                        : { ...n, style: undefined }
                )
            );
        };

        while (queue.length > 0) {
            const current = queue.shift()!;
            if (visited.has(current)) continue;
            visited.add(current);

            highlightNode(current);
            await new Promise((r) => setTimeout(r, 800));

            const outgoing = edges.filter((e) => e.source === current);
            outgoing.forEach((e) => {
                if (!visited.has(e.target)) queue.push(e.target);
            });
        }

        // Reset styles
        setNodes((nds) => nds.map((n) => ({ ...n, style: undefined })));
        setIsSimulating(false);
    };

    return (
        <div className="glass-card p-6 border-brand-cyan/20">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center">
                        <Network size={20} className="text-brand-cyan" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Reakcijų mechanizmų konstruktorius</h3>
                        <p className="text-xs text-slate-400">Kurkite daugiapakopes reakcijas vilkimo principu</p>
                    </div>
                </div>
            </div>

            {/* Template selector */}
            <div className="flex flex-wrap gap-2 mb-4">
                {TEMPLATES.map((t, idx) => (
                    <button
                        key={t.name}
                        onClick={() => loadTemplate(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                            ${activeTemplate === idx
                                ? "bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30"
                                : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                            }`}
                    >
                        {t.name}
                        <span className="text-slate-500 ml-1">({t.description})</span>
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={() => addNode("reagent")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-cyan/10 text-brand-cyan text-xs font-semibold border border-brand-cyan/20 hover:bg-brand-cyan/20 transition-colors">
                    <Plus size={14} /> Reagentas
                </button>
                <button onClick={() => addNode("intermediate")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/10 text-amber-400 text-xs font-semibold border border-amber-400/20 hover:bg-amber-400/20 transition-colors">
                    <Plus size={14} /> Tarpinis
                </button>
                <button onClick={() => addNode("product")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-green/10 text-brand-green text-xs font-semibold border border-brand-green/20 hover:bg-brand-green/20 transition-colors">
                    <Plus size={14} /> Produktas
                </button>
                <div className="flex-1" />
                <button
                    onClick={simulate}
                    disabled={isSimulating}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand-cyan text-white text-xs font-bold hover:bg-cyan-500 disabled:opacity-50 transition-colors shadow-lg shadow-brand-cyan/20"
                >
                    <Play size={14} /> {isSimulating ? "Simuliuojama..." : "Simuliuoti"}
                </button>
                <button
                    onClick={() => loadTemplate(activeTemplate)}
                    className="p-1.5 rounded-lg bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 transition-colors"
                    title="Atstatyti"
                >
                    <RotateCcw size={14} />
                </button>
            </div>

            {/* React Flow canvas */}
            <div className="h-[350px] rounded-xl overflow-hidden border border-white/10 bg-brand-darker">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                    proOptions={{ hideAttribution: true }}
                    defaultEdgeOptions={{
                        animated: true,
                        style: { strokeWidth: 2 },
                    }}
                >
                    <Background color="#1e293b" gap={20} />
                    <Controls
                        showInteractive={false}
                        className="!bg-brand-card !border-white/10 !rounded-lg !shadow-lg [&>button]:!bg-brand-card [&>button]:!border-white/10 [&>button]:!text-slate-400 [&>button:hover]:!bg-white/10"
                    />
                </ReactFlow>
            </div>

            <p className="mt-3 text-[10px] text-slate-600 text-center">
                Vilkite mazgus norėdami perkelti • Junkite sujungimo taškus (●) norėdami kurti ryšius
            </p>
        </div>
    );
}
