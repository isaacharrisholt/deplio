<script lang="ts" context="module">
  const languageMappings = {
    Shell: 'shell',
    TypeScript: 'typescript',
    cURL: 'shell',
    Text: 'text',
    JSON: 'json',
    XML: 'xml',
    HTML: 'html',
  } as const

  export type Language = keyof typeof languageMappings

  export type LanguageWithCode = {
    code: string
    language: Language
    lineNumbers: boolean
  }
</script>

<script lang="ts">
  import hljs from 'highlight.js/lib/core'
  import shell from 'highlight.js/lib/languages/shell'
  import typescript from 'highlight.js/lib/languages/typescript'
  import xml from 'highlight.js/lib/languages/xml'
  import json from 'highlight.js/lib/languages/json'
  import 'highlight.js/styles/github-dark.css'
  import { CodeBlock, storeHighlightJs } from '@skeletonlabs/skeleton'

  export let language: Language
  export let code: string
  export let lineNumbers = false

  if (!$storeHighlightJs) {
    hljs.registerLanguage('shell', shell)
    hljs.registerLanguage('typescript', typescript)
    hljs.registerLanguage('xml', xml)
    hljs.registerLanguage('json', json)

    storeHighlightJs.set(hljs)
  }

  let displayCode = code
  $: if (language === 'JSON') {
    try {
      displayCode = JSON.stringify(JSON.parse(code), null, 2)
    } catch (e) {
      // Ignore
    }
  }
</script>

<CodeBlock
  code={displayCode}
  language={languageMappings[language]}
  {lineNumbers}
  background="bg-surface-600 max-h-96 overflow-y-auto"
/>
