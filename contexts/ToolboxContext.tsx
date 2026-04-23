"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  Plus,
  Minus,
  X,
  Divide,
  Variable,
  Clock,
  Timer,
  Layers,
  ArrowLeftRight,
  Box,
  type LucideIcon,
} from "lucide-react";

export interface ToolFromDB {
  key: string;
  label: string;
  sub: string;
  icon: string;
  bg: string;
  iconBg: string;
  border: string;
  hover: string;
  text: string;
}

export const toolIconMap: Record<string, LucideIcon> = {
  Plus,
  Minus,
  X,
  Divide,
  Variable,
  Clock,
  Timer,
  Layers,
  ArrowLeftRight,
  Box,
};

export interface ToolGroup {
  label: string;
  tools: ToolFromDB[];
}

interface ToolboxData {
  tools: ToolFromDB[];
  allToolGroups: ToolGroup[];
  typeLabel: string;
  question: string;
  questionImage: string | null;
  recommendedToolKeys: string[];
}

interface ToolboxContextValue extends ToolboxData {
  selectedTool: string | null;
  setSelectedTool: (key: string | null) => void;
  register: (data: ToolboxData) => void;
}

const ToolboxContext = createContext<ToolboxContextValue | null>(null);

export function useToolbox() {
  return useContext(ToolboxContext);
}

export function ToolboxProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ToolboxData>({
    tools: [],
    allToolGroups: [],
    typeLabel: "",
    question: "",
    questionImage: null,
    recommendedToolKeys: [],
  });
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const register = useCallback((newData: ToolboxData) => {
    setData(newData);
  }, []);

  return (
    <ToolboxContext.Provider
      value={{ ...data, selectedTool, setSelectedTool, register }}
    >
      {children}
    </ToolboxContext.Provider>
  );
}
