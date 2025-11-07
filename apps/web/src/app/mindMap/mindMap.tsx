"use client";

import { useEffect, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { MindMapProps } from "@/types";


export function MindMap({ subjectCode, subjectName, modules }: MindMapProps) {
  const [allNodes, setAllNodes] = useState<Node[]>([]);
  const [allEdges, setAllEdges] = useState<Edge[]>([]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];

    // Root node
    generatedNodes.push({
      id: "root",
      data: { label: `${subjectCode}: ${subjectName}` },
      position: { x: 0, y: 0 },
      style: { background: "#fef3c7", padding: 10, borderRadius: 8 },
    });

    let yPos = 150;

    modules.forEach((mod, index) => {
      const modId = `mod-${index}`;
      generatedNodes.push({
        id: modId,
        data: { label: mod.title },
        position: { x: index * 250 - 200, y: yPos },
        style: { background: "#dbeafe", padding: 8, borderRadius: 6 },
      });

      generatedEdges.push({
        id: `e-root-${modId}`,
        source: "root",
        target: modId,
      });

      const topics = mod.content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "");

      topics.forEach((topic, tIndex) => {
        const topicId = `topic-${index}-${tIndex}`;
        generatedNodes.push({
          id: topicId,
          data: { label: topic },
          position: {
            x: index * 250 - 200,
            y: yPos + (tIndex + 1) * 100,
          },
          style: { background: "#e0f2fe", padding: 6, borderRadius: 4 },
        });

        generatedEdges.push({
          id: `e-${modId}-${topicId}`,
          source: modId,
          target: topicId,
        });
      });
    });

    setAllNodes(generatedNodes);
    setAllEdges(generatedEdges);

    // Start with only root node
    setNodes([generatedNodes[0]]);
    setEdges([]);
  }, [modules, subjectCode, subjectName, setNodes, setEdges]);

  const handleNodeClick = (_: any, node: Node) => {
    const childrenEdges = allEdges.filter((e) => e.source === node.id);
    const childrenNodes = childrenEdges.map(
      (edge) => allNodes.find((n) => n.id === edge.target)!
    );

    // Toggle logic: If already shown, hide them (and their descendants)
    const currentlyVisible = childrenNodes.every((n) =>
      nodes.some((vn) => vn.id === n.id)
    );

    if (currentlyVisible) {
      // Remove children & their edges recursively
      const removeIds = new Set<string>();

      const collectDescendants = (id: string) => {
        allEdges
          .filter((e) => e.source === id)
          .forEach((e) => {
            removeIds.add(e.target);
            collectDescendants(e.target);
          });
      };
      collectDescendants(node.id);

      setNodes((nds) => nds.filter((n) => !removeIds.has(n.id)));
      setEdges((eds) =>
        eds.filter((e) => !removeIds.has(e.target) && !removeIds.has(e.source))
      );
    } else {
      // Show children
      setNodes((nds) => [...nds, ...childrenNodes]);
      setEdges((eds) => [...eds, ...childrenEdges]);
    }
  };

  return (
    <div className="h-[500px] border rounded">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onInit={(reactFlowInstance) => {
          reactFlowInstance.fitView();
        }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
      ></ReactFlow>
    </div>
  );
}
