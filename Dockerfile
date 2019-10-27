FROM debian:buster

# --- DEPENDENCES GENERALES

    # Installation des depenedences generales
    RUN apt-get update && apt-get install -y --no-install-recommends \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        nano

# --- CHROME -----------------------------------
        
    # Ajout du depot pour google chrome
    RUN curl -sSL https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
        && echo "deb [arch=amd64] https://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list

    # Installation google chrome & nodejs
    RUN apt-get update && apt-get install -y --no-install-recommends google-chrome-stable

    # Ajout de l'utilisateur chrome
    RUN groupadd -r chrome && useradd -r -g chrome -G audio,video chrome
      #  && mkdir -p /home/chrome/reports && chown -R chrome:chrome /home/chrome


# --- NODEJS -----------------------------------------

    # Ajout du depot nodejs
    RUN curl -sSL https://deb.nodesource.com/setup_12.x | bash - 

    # Installation nodejs
    RUN apt-get update && apt-get install -y --no-install-recommends nodejs


# --- LIGHTHOUSE ------------------------------------

    RUN npm install -g lighthouse


# CRONTAB ------------------------------------------------

    # Installation
    RUN apt-get update && apt-get install -y --no-install-recommends cron

    # copie de la conf crontab root dans un fichier temporaire
    COPY conf/cron/root /tmp/crontab-root

    # Installation de la crontab root et suppression fichier tmp
    RUN crontab /tmp/crontab-root && rm /tmp/crontab-root


# LOGROTATE ------------------------------------------------

    # Installation
    RUN apt-get update && apt-get install -y --no-install-recommends logrotate

    # copie de la conf logrotate
    COPY conf/logrotate/lightkeeper /etc/logrotate.d/

    # Set les droits
    RUN chown root:root /etc/logrotate.d/lightkeeper && chmod 644 /etc/logrotate.d/lightkeeper


# --- LIGHTKEEPER -----------------------------------

    # Copie les sources
    COPY app /lightkeeper
    RUN chmod +x /lightkeeper/lh-*

    # Installation dépendences npm
    RUN cd /lightkeeper && npm install

    # Ajout dans le path
    ENV PATH="/lightkeeper:${PATH}"


# --- CONTAINER --------------------------------------

    # Dossier tmp
    RUN mkdir -p /lightkeeper/tmp && chmod 750 /lightkeeper/tmp

    # Entrypoint
    COPY /conf/docker/entrypoint /usr/local/bin/entrypoint
    RUN chmod +x /usr/local/bin/entrypoint
    ENTRYPOINT [ "entrypoint" ]

    # Set current workdir
    WORKDIR /lightkeeper

    # Commande par defaut
    CMD lh-runner
