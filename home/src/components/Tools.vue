<template>
  <n-flex justify="center" class="py-16">
    <n-card
      :bordered="false"
      class="max-w-2xl"
      :style="{ backgroundColor: 'transparent', boxShadow: 'none' }"
    >
      <n-h2 class="underline underline-offset-8">Tools</n-h2>
      <n-grid :y-gap="48" :cols="1">
        <!-- Languages -->
        <n-grid-item>
          <n-grid :cols="4">
            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-python-plain-wordmark"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-typescript-plain"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-javascript-plain"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-php-plain"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>
          </n-grid>
        </n-grid-item>

        <!-- Frameworks and Libraries -->
        <n-grid-item>
          <n-grid :cols="4">
            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-django-plain"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-djangorest-plain"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-vuejs-plain"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-htmx-plain-wordmark"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>
          </n-grid>
        </n-grid-item>

        <!-- Databases -->
        <n-grid-item>
          <n-grid :cols="4">
            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-postgresql-plain"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-mysql-original"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-redis-plain"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>
          </n-grid>
        </n-grid-item>

        <!-- Cloud Providers -->
        <n-grid-item>
          <n-grid :cols="4">
            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-googlecloud-plain"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-amazonwebservices-plain-wordmark"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-azure-plain"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>
          </n-grid>
        </n-grid-item>

        <!-- Infra -->
        <n-grid-item>
          <n-grid :y-gap="24" :cols="4">
            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-docker-plain"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-ubuntu-plain"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-linux-plain"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-terraform-plain"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-grid-itemthubactions-plain"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-nginx-original"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>
          </n-grid>
        </n-grid-item>

        <!-- Package Managers -->
        <n-grid-item>
          <n-grid :cols="4">
            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-pnpm-plain"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-poetry-plain"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>
          </n-grid>
        </n-grid-item>

        <!-- Others -->
        <n-grid-item>
          <n-grid :cols="4">
            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-wordpress-plain"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-tmux-plain"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-vim-plain"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>

            <n-grid-item>
              <n-flex justify="center">
                <n-icon size="50">
                  <i class="devicon-bash-plain"></i>
                </n-icon>
              </n-flex>
            </n-grid-item>
          </n-grid>
        </n-grid-item>
      </n-grid>
    </n-card>
  </n-flex>
</template>
