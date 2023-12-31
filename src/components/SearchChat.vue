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
            @click:append-inner="page = 0; search()"
            @keydown.enter="page = 0; search()"
        ></v-text-field>
        <v-infinite-scroll
            v-if="searching || matches.length > 0"
            :height="600"
            :items="matches"
            :onLoad="searchMore"
        >
          <div
              class="match"
              v-for="(match, index) in matches"
              :key="index"
          >
            <v-card
                :title="match.pageContent.split('\n')[0] + ' ' + (match.pageContent.split('\n')[1] || '')"
                :subtitle="'スコア: ' + (match.score * 100).toFixed(2) + '% | ' + new Date(match.metadata['timestamp']).toLocaleString('ja')"
                @click="overlayIndex = index"
            >
              <template v-slot:text>
                <pre>{{ summarize(match.pageContent) }}</pre>
              </template>
            </v-card>
          </div>
        </v-infinite-scroll>
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
import {Match, fetchMatches} from "@/util.ts";

const endpoint = ref('')
const query = ref('')
const searching = ref(false)
const page = ref(0)
const matches = ref(new Array<Match>())
const overlayIndex = ref(-1)
const hideEndpoint = ref(false)

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
  searching.value = true
  matches.value = []
}

const searchMore = async ({ done }: { done: (status: 'error' | 'loading' | 'empty' | 'ok') => void }) => {
  page.value++
  try {
    const embeddings = await fetchMatches(endpoint.value, query.value, 10, (page.value - 1) * 10)
    if (embeddings.results.length === 0) {
      return done('empty')
    }
    matches.value.push(...embeddings.results)
    matches.value.sort((a, b) => b.score - a.score)
    console.log(matches.value.length)
    done('ok')
  } catch (e) {
    console.error(e)
    done('error')
  }
}
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
