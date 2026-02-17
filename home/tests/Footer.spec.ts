import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import { NFlex, NIcon, NText } from "naive-ui";
import { Mail, LogoLinkedin } from "@vicons/ionicons5";

import Footer from "@/components/Footer.vue";

describe("Footer.vue", () => {
  const wrapper = mount(Footer, {
    global: {
      components: { NFlex, NIcon, NText },
    },
  });

  it("renders Naive UI components", () => {
    expect(wrapper.findComponent(NFlex).exists()).toBe(true);
    expect(wrapper.findComponent(NIcon).exists()).toBe(true);
    expect(wrapper.findComponent(NText).exists()).toBe(true);
  });

  it("renders ionicons5 components", () => {
    expect(wrapper.findComponent(Mail).exists()).toBe(true);
    expect(wrapper.findComponent(LogoLinkedin).exists()).toBe(true);
  });

  it("renders copyright text", () => {
    const copyrightText = wrapper.findComponent(NText);

    expect(copyrightText.text()).toBe(`© ${new Date().getFullYear()} twcoo`);
  });

  it("renders social and contact links", () => {
    const links = wrapper.findAll("a");

    expect(links).toHaveLength(3);

    expect(links[0].attributes("href")).toBe("https://github.com/twcoo");
    expect(links[1].attributes("href")).toBe(
      "https://www.linkedin.com/in/lester-cayabyab-5681953a5",
    );
    expect(links[2].attributes("href")).toBe("mailto:mflesterc@gmail.com");
  });
});
