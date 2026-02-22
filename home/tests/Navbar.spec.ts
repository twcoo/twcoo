import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";
import {
  NFlex,
  NAnchor,
  NAnchorLink,
  NIcon,
  NSwitch,
  NDrawer,
  NDrawerContent,
  NImage,
  NText,
  NButton,
} from "naive-ui";
import Navbar from "@/components/Navbar.vue";
import { Menu, SunnyOutline, Moon } from "@vicons/ionicons5";
import { createTestingPinia } from "@pinia/testing";
import { useThemeStore } from "@/stores/theme";

describe("Navbar.vue", () => {
  const wrapper = mount(Navbar, {
    global: {
      components: {
        NFlex,
        NAnchor,
        NAnchorLink,
        NIcon,
        NSwitch,
        NDrawer,
        NDrawerContent,
        NImage,
        NText,
        NButton,
        Menu,
        SunnyOutline,
        Moon,
      },
      plugins: [
        createTestingPinia({
          initialState: {
            theme: { isDark: false },
          },
          createSpy: vi.fn,
        }),
      ],
    },
  });

  const themeStore = useThemeStore();

  it("renders Naive UI components", () => {
    expect(wrapper.findComponent(NFlex).exists()).toBe(true);
    expect(wrapper.findComponent(NAnchor).exists()).toBe(true);
    expect(wrapper.findComponent(NAnchorLink).exists()).toBe(true);
    expect(wrapper.findComponent(NIcon).exists()).toBe(true);
    expect(wrapper.findComponent(NSwitch).exists()).toBe(true);
    expect(wrapper.findComponent(NDrawer).exists()).toBe(true);
  });

  it("renders ionicons5 components", () => {
    expect(wrapper.findComponent(Menu).exists()).toBe(true);
  });

  it("renders correct logo and brand text based on theme", async () => {
    const brandText = wrapper.findComponent(NText);

    let logo = wrapper.find("img");
    expect(logo.attributes("src")).toBe("/twcoo_logo_light.png");
    expect(brandText.text()).toBe("twcoo");

    themeStore.isDark = true;
    await wrapper.vm.$nextTick();

    logo = wrapper.find("img");
    expect(logo.attributes("src")).toBe("/twcoo_logo_dark.png");
  });

  it("renders links", () => {
    const links = wrapper.findAllComponents(NAnchorLink);

    const linkTitles = links.map((l) => l.props("title"));

    expect(linkTitles).toEqual(["Profile", "Timeline", "Tools"]);
  });

  it("validate theme switch", async () => {
    const switchComp = wrapper.findComponent(NSwitch);
    expect(themeStore.isDark).toBe(true);

    await switchComp.vm.$emit("update:value", true);
    expect(themeStore.isDark).toBe(true);
    expect(wrapper.findComponent(SunnyOutline).exists()).toBe(true);

    await switchComp.vm.$emit("update:value", false);
    expect(themeStore.isDark).toBe(false);
    expect(wrapper.findComponent(Moon).exists()).toBe(true);
  });

  it("renders drawer when hamburger clicked", async () => {
    const drawerButton = wrapper.findComponent(NButton);

    expect(drawerButton.exists()).toBe(true);

    await drawerButton.trigger("click");

    const drawerContent = wrapper.findComponent(NDrawerContent);
    expect(drawerContent.exists()).toBe(true);

    const links = drawerContent.findAllComponents(NAnchorLink);
    const linkTitles = links.map((l) => l.props("title"));

    expect(linkTitles).toEqual(["Profile", "Timeline", "Tools"]);
  });
});
