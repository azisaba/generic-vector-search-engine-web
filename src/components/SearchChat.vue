<template>
  <v-main>
    <v-container class="fill-height">
      <v-responsive class="fill-height">
        <slot name="mode-selector" />
        <v-text-field
            label="APIエンドポイント"
            prepend-icon="mdi-code-tags"
            v-model="endpoint"
            :type="hideEndpoint ? 'password' : 'text'"
            :append-inner-icon="hideEndpoint ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append-inner="hideEndpoint = !hideEndpoint"
        ></v-text-field>
        <v-text-field
            label="検索クエリ"
            append-inner-icon="mdi-magnify"
            v-model="query"
            @click:append-inner="page = 1; search()"
            @keydown.enter="page = 1; search()"
        >
          <v-progress-linear
              :active="searching"
              :indeterminate="true"
              :absolute="true"
              color="blue"
          ></v-progress-linear>
        </v-text-field>
        <chevron-left-right
            :left-disabled="searching || page <= 1"
            :right-disabled="searching || matches.length < 10 || page >= 30"
            @left="page--; search()"
            @right="page++; search()"
        />
        <div
            class="match"
            v-for="(match, index) in (searching ? Array.from<Match>({ length: 10 }) : matches)"
            :key="index"
        >
          <v-skeleton-loader
              v-if="searching"
              type="article"
          ></v-skeleton-loader>
          <v-card
              v-else
              :title="match.pageContent.split('\n')[0] + ' ' + (match.pageContent.split('\n')[1] || '')"
              :subtitle="'スコア: ' + (match.score * 100).toFixed(2) + '% | ' + new Date(match.metadata['timestamp']).toLocaleString('ja')"
              @click="overlayIndex = index"
          >
            <template v-slot:text>
              <pre>{{ summarize(match.pageContent) }}</pre>
            </template>
          </v-card>
        </div>
        <chevron-left-right
            :left-disabled="searching || page <= 1"
            :right-disabled="searching || matches.length < 10"
            @left="page--; search()"
            @right="page++; search()"
        />
      </v-responsive>
    </v-container>
    <v-overlay
        :model-value="overlayIndex >= 0"
        @after-leave="overlayIndex = -1"
        class="align-center justify-center"
    >
      <v-card
          v-if="overlayIndex >= 0"
          :title="matches[overlayIndex].pageContent.split('\n')[0] + ' ' + (matches[overlayIndex].pageContent.split('\n')[1] || '')"
          :subtitle="new Date(matches[overlayIndex].metadata['timestamp']).toLocaleString('ja')"
      >
        <template v-slot:text>
          <pre>書いた人: {{ matches[overlayIndex].metadata['author_name'] }}</pre>
          <pre>{{ matches[overlayIndex].pageContent }}</pre>
          <br />
          <a :href="matches[overlayIndex].metadata['url']" target="_blank">メッセージリンク↗</a>
          <template v-if="matches[overlayIndex].metadata['attachments']">
            <p>添付ファイル:</p>
            <ul>
              <li v-for="(item, index) in matches[overlayIndex].metadata['attachments'].split('\n')" :key="index">{{ item }}</li>
            </ul>
          </template>
        </template>
      </v-card>
    </v-overlay>
  </v-main>
</template>

<script setup lang="ts">
import {ref} from "vue";
import ChevronLeftRight from "@/components/ChevronLeftRight.vue";
import {Match, fetchMatches} from "@/util.ts";

const endpoint = ref('')
const query = ref('')
const searching = ref(false)
//const generating = ref(false)
const page = ref(1)
const matches = ref(new Array<Match>())
//const summary = ref('')
const overlayIndex = ref(-1)
const hideEndpoint = ref(false)

let updateIndex = 0

const summarize = (text: string) => {
  const lines = text.split('\n')
  if (lines.length > 3) {
    return lines.slice(0, 3).join('\n') + '...'
  } else {
    return text
  }
}

const search = async () => {
  if (!query.value) return
  if (!endpoint.value) return
  const currentIndex = ++updateIndex
  searching.value = true
  try {
    matches.value = []
    const embeddings = await fetchMatches(endpoint.value, query.value, 10, (page.value - 1) * 10)
    matches.value = embeddings.results
    console.log(embeddings)
  } finally {
    if (currentIndex === updateIndex) searching.value = false
  }
}

/*
const generate = async () => {
  generating.value = true
  try {
    let text = ''
    for (const match of matches.value) {
      text += `\n\nFile: \`${match.metadata['id']}\`\nContext data:\n\n\n\`\`\`\n${match.metadata['text']}\n\`\`\`\n`
    }
    summary.value = await summarizeAsync(text, '入力された内容を最大300文字程度に要約してユーザーに伝えてください。', 500)
  } finally {
    generating.value = false
  }
}
*/
</script>

<style scoped>
.match {
  margin-top: 20px;
}

/*noinspection CssInvalidPropertyValue*/
pre {
  overflow: auto;
  text-wrap: wrap;
}
</style>
