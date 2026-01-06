import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { NFlex, NCard, NText } from 'naive-ui'
import Profile from '@/components/Profile.vue'

describe('Profile.vue', () => {
  const wrapper = mount(Profile, {
    global: {
      components: { NFlex, NCard, NText },
    },
  })

  it('renders Naive UI components', () => {
    expect(wrapper.findComponent(NFlex).exists()).toBe(true)
    expect(wrapper.findComponent(NCard).exists()).toBe(true)
    expect(wrapper.findComponent(NText).exists()).toBe(true)
  })

  it('renders two n-text with <strong> content', () => {
    const nTexts = wrapper.findAllComponents(NText)
    expect(nTexts).toHaveLength(2)

    nTexts.forEach(ntext => {
      const strongEl = ntext.find('strong')
      expect(strongEl.exists()).toBe(true)
    })
  })

  it('renders the docs.threewhitecatsoneorange.dev link', () => {
    const link = wrapper.get('a')
    expect(link.text()).toBe('docs.threewhitecatsoneorange.dev')
  })

  it('renders corrent content', () => {
    const nTexts = wrapper.findAllComponents(NText)

    const firstNtext = nTexts[0].text()

    expect(firstNtext).toBe(
      'I’m a software engineer with a focus on backend and infrastructure. I build end-to-end applications, develop API integrations, and help design automations to store and produce data that support data engineering workflows. I also manage infrastructure on cloud platforms, while guiding a small team and reviewing code to ensure quality and scalability.',
    )

    const secondNtext = nTexts[1].text()

    expect(secondNtext).toBe(
      'I also maintain docs.threewhitecatsoneorange.dev, where I share notes, interests, and topics I’m currently exploring.',
    )
  })
})
