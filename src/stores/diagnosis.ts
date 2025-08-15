import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DiagnosisRecord, AnalysisResult } from '@/types/diagnosis'

export const useDiagnosisStore = defineStore('diagnosis', () => {
  const currentAnalysis = ref<AnalysisResult | null>(null)
  const diagnosisHistory = ref<DiagnosisRecord[]>([])
  
  const loadHistory = () => {
    const saved = localStorage.getItem('tcm-diagnosis-history')
    if (saved) {
      diagnosisHistory.value = JSON.parse(saved)
    }
  }

  const saveHistory = () => {
    localStorage.setItem('tcm-diagnosis-history', JSON.stringify(diagnosisHistory.value))
  }

  const addDiagnosisRecord = (record: DiagnosisRecord) => {
    diagnosisHistory.value.unshift(record)
    saveHistory()
  }

  const setCurrentAnalysis = (analysis: AnalysisResult) => {
    currentAnalysis.value = analysis
  }

  const clearCurrentAnalysis = () => {
    currentAnalysis.value = null
  }

  const getDiagnosisById = (id: string): DiagnosisRecord | null => {
    return diagnosisHistory.value.find(record => record.id === id) || null
  }

  const deleteDiagnosisRecord = (id: string) => {
    diagnosisHistory.value = diagnosisHistory.value.filter(record => record.id !== id)
    saveHistory()
  }

  return {
    currentAnalysis,
    diagnosisHistory,
    loadHistory,
    addDiagnosisRecord,
    setCurrentAnalysis,
    clearCurrentAnalysis,
    getDiagnosisById,
    deleteDiagnosisRecord
  }
})