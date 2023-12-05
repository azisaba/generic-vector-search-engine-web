<template>
  <v-main>
    <v-container class="fill-height">
      <v-responsive class="fill-height">
        <slot name="mode-selector" />
        <v-select
            label="ソース"
            v-model="endpoint"
            :items="endpoints"
            :multiple="true"
        ></v-select>
        <v-text-field
            label="検索クエリ"
            append-inner-icon="mdi-magnify"
            v-model="query"
            @click:append-inner="page = 0; search()"
            @keydown.enter="page = 0; search()"
        ></v-text-field>
        <v-expansion-panels>
          <v-expansion-panel title="日時でフィルター">
            <v-expansion-panel-text>
              <div style="display: flex; flex-direction: row;">
                <v-date-picker
                    v-model="filterBefore"
                    title="検索範囲(～の前)"
                ></v-date-picker>
                <v-date-picker
                    v-model="filterAfter"
                    title="検索範囲(～の後)"
                ></v-date-picker>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
          <v-expansion-panel title="作成者でフィルター">
            <v-expansion-panel-text>
              <v-text-field
                  v-model="filterAuthorName"
                  label="作成者ユーザー名"
                  :clearable="true"
              ></v-text-field>
            </v-expansion-panel-text>
            <v-expansion-panel-text>
              <v-text-field
                  v-model="filterAuthorId"
                  label="作成者ユーザーID"
                  :clearable="true"
              ></v-text-field>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
        <v-btn color="green" @click="filterBefore = null; filterAfter = null;">検索条件をクリア</v-btn>
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
import {useDate} from "vuetify";

const date = useDate()
const endpoints = [
  {title: 'Lifeパッチノート', value: 'https://vectorsearch--life-patch-notes-search.azisaba.net/query'},
]
const endpoint = ref([endpoints[0].value])
const query = ref('')
const searching = ref(false)
const page = ref(0)
const matches = ref(new Array<Match>())
const overlayIndex = ref(-1)
const filterBefore = ref<string | null>(null)
const filterAfter = ref<string | null>(null)
const filterAuthorName = ref('')
const filterAuthorId = ref('')

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
  if (!endpoint.value.length) return
  searching.value = true
  matches.value = []
}

const searchMore = async ({ done }: { done: (status: 'error' | 'loading' | 'empty' | 'ok') => void }) => {
  page.value++
  console.log('page', page.value)
  try {
    const combined = new Array<Match>()
    for (const url of endpoint.value) {
      const filters = new Array<string>()
      if (filterBefore.value) {
        filters.push(`timestamp < ${(date.date(filterBefore.value) as Date).getTime()}`)
      }
      if (filterAfter.value) {
        filters.push(`timestamp > ${(date.date(filterAfter.value) as Date).getTime()}`)
      }
      if (filterAuthorName.value) {
        filters.push(`author_name == "${filterAuthorName.value}"`)
      }
      if (filterAuthorId.value) {
        filters.push(`author_id == "${filterAuthorId.value}"`)
      }
      const embeddings = await fetchMatches(url, query.value, 10, (page.value - 1) * 10, filters.join(' && '))
      if (embeddings.results.length === 0) {
        return done('empty')
      }
      combined.push(...embeddings.results)
    }
    if (combined.length === 0) {
      return done('empty')
    }
    matches.value.push(...combined)
    matches.value.sort((a, b) => b.score - a.score)
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
