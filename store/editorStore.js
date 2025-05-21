// editorStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useEditorStore = create(
  persist(
    (set, get) => ({
      editorContent: '',
      versions: [],
      setEditorContent: (content) => set({ editorContent: content }),
      addVersion: (version) => set((state) => ({ versions: [version, ...state.versions] })),
      deleteVersion: (id) => set((state) => ({ 
        versions: state.versions.filter((v) => v.id !== id) 
      })),
      getVersions: () => get().versions,
    }),
    {
      name: 'editor-storage',
      getStorage: () => localStorage,
    }
  )
);

export default useEditorStore;