import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { NFlex, NCard, NH2, NH3, NH4, NTimeline, NTimelineItem } from 'naive-ui'
import Timeline from '@/components/Timeline.vue'
import timeline from '@/data/timeline'
import { Briefcase } from '@vicons/ionicons5'

describe('Timeline.vue', () => {
  const wrapper = mount(Timeline, {
    global: {
      components: {
        NFlex,
        NCard,
        NH2,
        NH3,
        NH4,
        NTimeline,
        NTimelineItem,
        Briefcase,
      },
    },
  })

  it('renders Naive UI components', () => {
    expect(wrapper.findComponent(NFlex).exists()).toBe(true)
    expect(wrapper.findComponent(NCard).exists()).toBe(true)
    expect(wrapper.findComponent(NH2).exists()).toBe(true)
    expect(wrapper.findComponent(NH3).exists()).toBe(true)
    expect(wrapper.findComponent(NH4).exists()).toBe(true)
    expect(wrapper.findComponent(NTimeline).exists()).toBe(true)
    expect(wrapper.findComponent(NTimelineItem).exists()).toBe(true)
  })

  it('renders ionicons5 components', () => {
    expect(wrapper.findComponent(Briefcase).exists()).toBe(true)
  })

  it('renders timeline items correctly', () => {
    const items = wrapper.findAllComponents(NTimelineItem)

    items.forEach((itemWrapper, idx) => {
      const item = timeline[idx]

      expect(itemWrapper.props('time')).toBe(`${item.year} - ${item.duration}`)
      expect(itemWrapper.props('content')).toBe(item.details)
      expect(itemWrapper.text()).toContain(item.title)
      expect(itemWrapper.text()).toContain(item.company)
    })
  })
})
