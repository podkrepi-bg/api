FROM bitnami/postgresql:13-debian-10 AS builder

# Use root
USER 0

# Create postgres user
RUN useradd postgres

# Pull fresh repo list
RUN apt-get clean && \
    apt-get update -y && \
    apt-get upgrade -y && \
    apt-get autoremove -y && apt-get clean

# ===== UNCOMMENT THE BELOW WHEN PG_CRON BECOMES NEEDED ===== 

# Build and tools packages.
# RUN apt-get install -y \
#     git \
#     make \
#     cmake \
#     build-essential \
#     libssl-dev

# # Clean APT
# RUN apt-get clean && \
#     rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# # Install pg_prove
# RUN curl -LO http://xrl.us/cpanm \
#     && chmod +x cpanm \
#     && ./cpanm TAP::Parser::SourceHandler::pgTAP

# # Install pg_cron
# ENV PG_CRON_VERSION v1.3.0
# RUN git clone --depth 1 https://github.com/citusdata/pg_cron.git -b $PG_CRON_VERSION \
#     && cd pg_cron \
#     && PATH=$PATH make install && cd ../ && rm -rf pg_cron

# # Install pgtap
# ENV PGTAP_VERSION v1.1.0
# RUN git clone --depth 1 https://github.com/theory/pgtap.git -b $PGTAP_VERSION \
#     && cd pgtap \
#     && make && make install && cd ../ && rm -rf pgtap

# # Install pg_hashids
# ENV PG_HASHIDS_VERSION v1.2.1
# RUN git clone --depth 1 https://github.com/iCyberon/pg_hashids.git -b $PG_HASHIDS_VERSION \
#     && cd pg_hashids \
#     && make && make install && cd ../ && rm -rf pg_hashids

# RUN apt-get purge -y \
#     git \
#     make \
#     cmake \
#     build-essential \
#     libssl-dev \
#     && apt-get autoremove -y && apt-get clean

# Apply configuration
# COPY ./conf.d/* /bitnami/postgresql/conf/conf.d/

# ===== UNCOMMENT THE ABOVE WHEN PG_CRON BECOMES NEEDED ===== 

COPY ./init.d/* /docker-entrypoint-initdb.d/

USER 1001
