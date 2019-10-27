FROM debian:buster

# --- GENERAL DEPENDENCIES

    # general dependencies installation
    RUN apt-get update && apt-get install -y --no-install-recommends \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        nano


# --- CHROME -----------------------------------
        
    # Adding repo for chrome
    RUN curl -sSL https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
        && echo "deb [arch=amd64] https://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list

    # Chrome installation
    RUN apt-get update && apt-get install -y --no-install-recommends google-chrome-stable

    # Adds chrome user
    RUN groupadd -r chrome && useradd -r -g chrome -G audio,video chrome


# --- NODEJS -----------------------------------------

    # Adding repo for nodejs
    RUN curl -sSL https://deb.nodesource.com/setup_12.x | bash - 

    # nodejs installation
    RUN apt-get update && apt-get install -y --no-install-recommends nodejs


# --- LIGHTHOUSE ------------------------------------

    # lighthouse installation
    RUN npm install -g lighthouse


# CRONTAB ------------------------------------------------

    # Installation
    RUN apt-get update && apt-get install -y --no-install-recommends cron

    # Copy crontab conf to tmp file
    COPY conf/cron/root /tmp/crontab-root

    # Installing crontab and removing tmp file
    RUN crontab /tmp/crontab-root && rm /tmp/crontab-root


# LOGROTATE ------------------------------------------------

    # Installation
    RUN apt-get update && apt-get install -y --no-install-recommends logrotate

    # copy logrotate configuration
    COPY conf/logrotate/lightkeeper /etc/logrotate.d/

    # Set rights
    RUN chown root:root /etc/logrotate.d/lightkeeper && chmod 644 /etc/logrotate.d/lightkeeper


# --- LIGHTKEEPER -----------------------------------

    # Copy sources
    COPY app /lightkeeper
    RUN chmod +x /lightkeeper/lh-*

    # npm dependencies
    RUN cd /lightkeeper && npm install

    # Adds to path
    ENV PATH="/lightkeeper:${PATH}"


# --- CONTAINER --------------------------------------

    # Entrypoint
    COPY /conf/docker/entrypoint /usr/local/bin/entrypoint
    RUN chmod +x /usr/local/bin/entrypoint
    ENTRYPOINT [ "entrypoint" ]

    # Set current workdir
    WORKDIR /lightkeeper

    # default command
    CMD lh-runner
