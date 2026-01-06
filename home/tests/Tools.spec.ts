import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import Tools from '@/components/Tools.vue'
import { NFlex, NCard, NH2, NIcon, NGrid, NGridItem } from 'naive-ui'

describe('Tools.vue', () => {
  const wrapper = mount(Tools, {
    global: {
      components: {
        NFlex,
        NCard,
        NH2,
        NIcon,
        NGrid,
        NGridItem,
      },
    },
  })

  it('renders Naive UI components', () => {
    expect(wrapper.findComponent(NFlex).exists()).toBe(true)
    expect(wrapper.findComponent(NCard).exists()).toBe(true)
    expect(wrapper.findComponent(NH2).exists()).toBe(true)
    expect(wrapper.findComponent(NIcon).exists()).toBe(true)
    expect(wrapper.findComponent(NGrid).exists()).toBe(true)
    expect(wrapper.findComponent(NGridItem).exists()).toBe(true)
  })

  it('renders correct number of icons in each category', () => {
    // Count occurrences of devicon classes
    expect(wrapper.findAll('.devicon-python-plain-wordmark').length).toBe(1)
    expect(wrapper.findAll('.devicon-typescript-plain').length).toBe(1)
    expect(wrapper.findAll('.devicon-javascript-plain').length).toBe(1)
    expect(wrapper.findAll('.devicon-php-plain').length).toBe(1)

    // Frameworks and Libraries
    expect(wrapper.findAll('.devicon-django-plain').length).toBe(1)
    expect(wrapper.findAll('.devicon-djangorest-plain').length).toBe(1)
    expect(wrapper.findAll('.devicon-vuejs-plain').length).toBe(1)
    expect(wrapper.findAll('.devicon-htmx-plain-wordmark').length).toBe(1)

    // Databases
    expect(wrapper.findAll('.devicon-postgresql-plain').length).toBe(1)
    expect(wrapper.findAll('.devicon-mysql-original').length).toBe(1)
    expect(wrapper.findAll('.devicon-redis-plain').length).toBe(1)

    // Cloud
    expect(wrapper.findAll('.devicon-googlecloud-plain').length).toBe(1)
    expect(
      wrapper.findAll('.devicon-amazonwebservices-plain-wordmark').length,
    ).toBe(1)
    expect(wrapper.findAll('.devicon-azure-plain').length).toBe(1)

    // Infra
    expect(wrapper.findAll('.devicon-docker-plain').length).toBe(1)
    expect(wrapper.findAll('.devicon-ubuntu-plain').length).toBe(1)
    expect(wrapper.findAll('.devicon-linux-plain').length).toBe(1)
    expect(wrapper.findAll('.devicon-terraform-plain').length).toBe(1)

    // Package Managers
    expect(wrapper.findAll('.devicon-pnpm-plain').length).toBe(1)
    expect(wrapper.findAll('.devicon-poetry-plain').length).toBe(1)

    // Others
    expect(wrapper.findAll('.devicon-wordpress-plain').length).toBe(1)
    expect(wrapper.findAll('.devicon-tmux-plain').length).toBe(1)
    expect(wrapper.findAll('.devicon-vim-plain').length).toBe(1)
    expect(wrapper.findAll('.devicon-bash-plain').length).toBe(1)
  })
})
