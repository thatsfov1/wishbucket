FROM apify/actor-node-playwright-chrome:22

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

COPY package.json pnpm-lock.yaml* ./
RUN corepack pnpm install --prod --frozen-lockfile=false

COPY . ./

CMD corepack pnpm start
