FROM rabbitmq:3.13-management

# Install delayed message exchange plugin (community plugin from RabbitMQ team)
ARG RABBITMQ_DELAYED_VERSION=3.13.0
ADD --chown=rabbitmq:rabbitmq \
    https://github.com/rabbitmq/rabbitmq-delayed-message-exchange/releases/download/v${RABBITMQ_DELAYED_VERSION}/rabbitmq_delayed_message_exchange-${RABBITMQ_DELAYED_VERSION}.ez \
    /opt/rabbitmq/plugins/

COPY enabled_plugins /etc/rabbitmq/enabled_plugins
