'use client'

import { useEffect, useState } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { useSettingsStore } from '@/stores/settings-store'
import { SettingsTabs, type SettingsTab } from '@/components/settings/settings-tabs'
import { ModelProviderCard } from '@/components/settings/model-provider-card'
import { ProviderConfigForm } from '@/components/settings/provider-config-form'
import { ConnectivityTestButton } from '@/components/settings/connectivity-test-button'
import { McpServerConfig } from '@/components/settings/mcp-server-config'
import { TavilyConfig } from '@/components/settings/tavily-config'
import { DefaultModelSelector } from '@/components/settings/default-model-selector'
import type { ProviderConfigRequest } from '@/types/settings'
import { Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const {
    providers, providerConfig, isLoading,
    fetchProviders, fetchProviderConfig, updateProvider, deleteProvider, testProvider,
  } = useSettingsStore()

  const [activeTab, setActiveTab] = useState<SettingsTab>('providers')
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  useEffect(() => {
    if (selectedProvider) {
      fetchProviderConfig(selectedProvider)
    }
  }, [selectedProvider, fetchProviderConfig])

  const handleSaveProvider = async (config: ProviderConfigRequest) => {
    if (!selectedProvider) return
    await updateProvider(selectedProvider, config)
    await fetchProviderConfig(selectedProvider)
  }

  const handleDeleteProvider = async () => {
    if (!selectedProvider) return
    await deleteProvider(selectedProvider)
    setSelectedProvider(null)
  }

  const safeProviders = Array.isArray(providers) ? providers : []

  const renderProviderTab = () => {
    if (selectedProvider) {
      const catalog = safeProviders.find((p) => p.id === selectedProvider)
      if (!catalog) return null

      return (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedProvider(null)}
            className="text-sm text-[var(--primary)] hover:underline"
          >
            ← 返回供应商列表
          </button>

          <ProviderConfigForm
            providerId={selectedProvider}
            providerName={catalog.name}
            defaultBaseUrl={catalog.base_url}
            defaultModels={catalog.models}
            config={providerConfig}
            onSave={handleSaveProvider}
            onDelete={handleDeleteProvider}
            onClose={() => setSelectedProvider(null)}
          />

          {providerConfig?.configured && (
            <div className="card p-6 space-y-3">
              <h3 className="font-bold">连接测试</h3>
              <ConnectivityTestButton
                onTest={() => testProvider(selectedProvider)}
                lastResult={providerConfig.last_test_result}
              />
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">模型供应商</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : (
          <div className="space-y-3">
            {safeProviders.map((provider) => (
              <ModelProviderCard
                key={provider.id}
                provider={provider}
                onClick={() => setSelectedProvider(provider.id)}
              />
            ))}
            {safeProviders.length === 0 && (
              <p className="text-[var(--text-muted)] py-8 text-center">暂无可用供应商</p>
            )}
          </div>
        )}

        <DefaultModelSelector />
      </div>
    )
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'providers':
        return renderProviderTab()
      case 'mcp':
        return <McpServerConfig />
      case 'tavily':
        return <TavilyConfig />
      case 'other':
        return (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <p className="text-lg">更多工具集成即将推出</p>
            <p className="text-sm mt-2">敬请期待</p>
          </div>
        )
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-14 max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold mb-10">设置</h1>

        <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab}>
          {renderTab()}
        </SettingsTabs>
      </main>
    </>
  )
}
