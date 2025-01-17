import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { nodesAreRelatives } from '~/components/Universe/constants'
import { isChileGraph } from '~/constants'
import { fetchGraphData } from '~/network/fetchGraphData'
import { GraphData, NodeExtended, NodeType, Sources, TStats, Trending } from '~/types'
import { saveSearchTerm } from '~/utils/relayHelper/index'

export type GraphStyle = 'sphere' | 'force' | 'split' | 'earth'

export const graphStyles: GraphStyle[] = ['sphere', 'force', 'split', 'earth']

export type FetchNodeParams = {
  word?: string
  skip_cache?: string
  free?: string
  media_type?: string
}

export type DataStore = {
  scrollEventsDisabled: boolean
  categoryFilter: NodeType | null
  disableCameraRotation: boolean
  graphRadius: number | null
  data: GraphData | null
  selectionGraphData: GraphData
  graphStyle: GraphStyle
  isFetching: boolean
  hoveredNode: NodeExtended | null
  selectedNode: NodeExtended | null
  selectedTimestamp: NodeExtended | null
  sources: Sources[] | null
  queuedSources: Sources[] | null
  sphinxModalIsOpen: boolean
  cameraFocusTrigger: boolean
  selectedNodeRelativeIds: string[]
  nearbyNodeIds: string[]
  showSelectionGraph: boolean
  showTeachMe: boolean
  hideNodeDetails: boolean
  sidebarFilter: string
  trendingTopics: Trending[]
  stats: TStats | null

  setTrendingTopics: (trendingTopics: Trending[]) => void
  setStats: (stats: TStats) => void
  setSidebarFilter: (filter: string) => void
  setScrollEventsDisabled: (scrollEventsDisabled: boolean) => void
  setCategoryFilter: (categoryFilter: NodeType | null) => void
  setDisableCameraRotation: (rotation: boolean) => void
  fetchData: (setBudget: (value: number | null) => void, params?: FetchNodeParams) => void
  setData: (data: GraphData) => void
  setGraphStyle: (graphStyle: GraphStyle) => void
  setGraphRadius: (graphRadius?: number | null) => void
  setHoveredNode: (hoveredNode: NodeExtended | null) => void
  setSelectedNode: (selectedNode: NodeExtended | null) => void
  setSelectedTimestamp: (selectedTimestamp: NodeExtended | null) => void
  setSources: (sources: Sources[] | null) => void
  setQueuedSources: (sources: Sources[] | null) => void
  setSphinxModalOpen: (_: boolean) => void
  setCameraFocusTrigger: (_: boolean) => void
  setIsFetching: (_: boolean) => void
  setNearbyNodeIds: (_: string[]) => void
  setShowSelectionGraph: (_: boolean) => void
  setSelectionData: (data: GraphData) => void
  setHideNodeDetails: (_: boolean) => void
  setTeachMe: (_: boolean) => void
  addNewNode: (node: NodeExtended) => void
  removeNode: (node: NodeExtended) => void
}

const defaultData: Omit<
  DataStore,
  | 'setTrendingTopics'
  | 'setStats'
  | 'setSidebarFilter'
  | 'fetchData'
  | 'setIsFetching'
  | 'setData'
  | 'setCameraAnimation'
  | 'setScrollEventsDisabled'
  | 'setCategoryFilter'
  | 'setDisableCameraRotation'
  | 'setHoveredNode'
  | 'setSelectedNode'
  | 'setSelectedTimestamp'
  | 'setSphinxModalOpen'
  | 'setCameraFocusTrigger'
  | 'setSources'
  | 'setQueuedSources'
  | 'setGraphRadius'
  | 'setGraphStyle'
  | 'setNearbyNodeIds'
  | 'setShowSelectionGraph'
  | 'setSelectionData'
  | 'setHideNodeDetails'
  | 'setTeachMe'
  | 'addNewNode'
  | 'removeNode'
> = {
  categoryFilter: null,
  data: null,
  selectionGraphData: { nodes: [], links: [] },
  scrollEventsDisabled: false,
  disableCameraRotation: false,
  graphRadius: isChileGraph ? 1600 : 3056, // calculated from initial load
  graphStyle: (localStorage.getItem('graphStyle') as GraphStyle) || 'sphere',
  isFetching: false,
  queuedSources: null,
  hoveredNode: null,
  selectedNode: null,
  selectedTimestamp: null,
  sources: null,
  sphinxModalIsOpen: false,
  cameraFocusTrigger: false,
  selectedNodeRelativeIds: [],
  nearbyNodeIds: [],
  showSelectionGraph: false,
  showTeachMe: false,
  hideNodeDetails: false,
  sidebarFilter: 'all',
  trendingTopics: [],
  stats: null,
}

export const useDataStore = create<DataStore>()(
  devtools((set, get) => ({
    ...defaultData,
    fetchData: async (setBudget, params) => {
      if (get().isFetching) {
        return
      }

      set({ isFetching: true, sphinxModalIsOpen: true })

      const data = await fetchGraphData(get().graphStyle, setBudget, params ?? {})

      if (params?.word) {
        await saveSearchTerm()
      }

      set({
        data,
        isFetching: false,
        sphinxModalIsOpen: false,
        disableCameraRotation: false,
        nearbyNodeIds: [],
        selectedNodeRelativeIds: [],
        showSelectionGraph: false,
        showTeachMe: false,
      })
    },
    setTrendingTopics: (trendingTopics) => set({ trendingTopics }),
    setStats: (stats) => set({ stats }),
    setIsFetching: (isFetching) => set({ isFetching }),
    setData: (data) => set({ data }),
    setSelectionData: (selectionGraphData) => set({ selectionGraphData }),
    setScrollEventsDisabled: (scrollEventsDisabled) => set({ scrollEventsDisabled }),
    setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
    setDisableCameraRotation: (rotation) => set({ disableCameraRotation: rotation }),
    setGraphRadius: (graphRadius) => set({ graphRadius }),
    setGraphStyle: (graphStyle) => set({ graphStyle }),
    setQueuedSources: (queuedSources) => set({ queuedSources }),
    setHoveredNode: (hoveredNode) => set({ hoveredNode }),
    setSelectedNode: (selectedNode) => {
      const stateSelectedNode = get().selectedNode

      if (stateSelectedNode?.ref_id !== selectedNode?.ref_id) {
        const { data } = get()

        const relativeIds =
          data?.nodes.filter((f) => f.ref_id && nodesAreRelatives(f, selectedNode)).map((n) => n?.ref_id || '') || []

        set({
          hoveredNode: null,
          selectedNode,
          disableCameraRotation: true,
          selectedNodeRelativeIds: relativeIds,
        })
      }
    },
    setSidebarFilter: (sidebarFilter: string) => set({ sidebarFilter }),
    setSelectedTimestamp: (selectedTimestamp) => set({ selectedTimestamp }),
    setSources: (sources) => set({ sources }),
    setSphinxModalOpen: (sphinxModalIsOpen) => set({ sphinxModalIsOpen }),
    setCameraFocusTrigger: (cameraFocusTrigger) => set({ cameraFocusTrigger }),
    setNearbyNodeIds: (nearbyNodeIds) => {
      const stateNearbyNodeIds = get().nearbyNodeIds

      if (nearbyNodeIds.length !== stateNearbyNodeIds.length || nearbyNodeIds[0] !== stateNearbyNodeIds[0]) {
        set({ nearbyNodeIds })
      }
    },
    setShowSelectionGraph: (showSelectionGraph) => set({ showSelectionGraph }),
    setHideNodeDetails: (hideNodeDetails) => set({ hideNodeDetails }),
    setTeachMe: (showTeachMe) => set({ showTeachMe }),
    addNewNode: (node) => {
      const { data } = get()

      if (!data) {
        return
      }

      const newData = { ...data, nodes: [node, ...data.nodes] }

      set({ data: newData })
    },
    removeNode: (node) => {
      const { data } = get()

      if (!data) {
        return
      }

      const removeData = {
        ...data,
        nodes: data.nodes.filter(
          (el) => el.ref_id !== node.ref_id && el.id !== node.id && el.id !== node.ref_id && el.ref_id !== node.id,
        ),
      }

      set({ data: removeData })
    },
  })),
)

export const useSelectedNode = () => useDataStore((s) => s.selectedNode)

export const useFilteredNodes = () =>
  useDataStore((s) =>
    (s.data?.nodes || []).filter((i) => (s.sidebarFilter === 'all' ? true : i.node_type === s.sidebarFilter)),
  )
