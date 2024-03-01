<script lang="ts">
  import hljs from 'highlight.js/lib/core'
  import shell from 'highlight.js/lib/languages/shell'
  import typescript from 'highlight.js/lib/languages/typescript'
  import 'highlight.js/styles/github-dark.css'
  import { CodeBlock, storeHighlightJs, TabGroup, Tab } from '@skeletonlabs/skeleton'

  hljs.registerLanguage('shell', shell)
  hljs.registerLanguage('typescript', typescript)

  storeHighlightJs.set(hljs)

  const languageMappings = {
    Shell: 'shell',
    TypeScript: 'typescript',
    cURL: 'shell',
  } as const

  type Language = keyof typeof languageMappings

  type LanguageWithCode = {
    code: string
    language: Language
    lineNumbers: boolean
  }

  export let languages: LanguageWithCode[]

  let currentTab = 0
</script>

<div class="card variant-soft-surface p-4">
  <TabGroup>
    {#each languages as { language }, i}
      <Tab bind:group={currentTab} name={language} value={i}>
        {language}
      </Tab>
    {/each}

    <svelte:fragment slot="panel">
      <CodeBlock
        code={languages[currentTab].code}
        language={languageMappings[languages[currentTab].language]}
        lineNumbers={languages[currentTab].lineNumbers}
        background="bg-surface-600"
      />
    </svelte:fragment>
  </TabGroup>
</div>
