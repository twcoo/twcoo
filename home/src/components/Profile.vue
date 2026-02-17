<template>
  <n-flex justify="center" class="pt-16">
    <n-card
      :bordered="false"
      class="max-w-2xl"
      :style="{ backgroundColor: 'transparent', boxShadow: 'none' }"
    >
      <n-text class="text-lg">
        I’m a software engineer with a focus on
        <strong>backend and infrastructure</strong>. I build end-to-end
        applications, develop API integrations, and help design automations to
        store and produce data that support data engineering workflows. I also
        manage infrastructure on cloud platforms, while guiding a small team and
        reviewing code to ensure quality and scalability.
      </n-text>

      <n-text class="text-lg block mt-2">
        I also maintain
        <strong>
          <a
            href="https://docs.threewhitecatsoneorange.dev"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:underline"
            >docs.threewhitecatsoneorange.dev</a
          > </strong
        >, where I share notes, interests, and topics I’m currently exploring.
      </n-text>
    </n-card>
  </n-flex>
</template>
