from .base import *  # noqa: F403

DEBUG = False
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# Roda tasks do Celery em processo (sincronamente), sem precisar de um
# broker/worker real — os testes de views que disparam `.delay(...)`
# conseguem checar o efeito direto (ex: objetos criados no banco).
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Evita custo/rede acidental: por padrão os testes rodam sem chave, e cada
# teste que precisa simular uma resposta da IA usa override_settings +
# mock explicitamente.
ANTHROPIC_API_KEY = ""
