# builder: 依存を venv に隔離（/app の外＝bind マウントと干渉しない）
FROM python:3.13-slim AS builder
ENV PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"
COPY services/model/requirements.txt /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt

# dev: ホットリロード（ソースは compose の bind マウントで /app に入る）
# node イメージのような uid1000 ユーザーが無いので自前で作成し、そのユーザーで実行する。
# root のままだと __pycache__ 等が root 所有で bind マウントに残り、ホスト(ausbd=uid1000)の
# エディタが EACCES で保存できなくなる。PYTHONDONTWRITEBYTECODE で pyc 生成自体も抑止。
FROM python:3.13-slim AS dev
ENV PATH="/venv/bin:$PATH" PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app
COPY --from=builder /venv /venv
RUN useradd -m -u 1000 app && chown app:app /app
USER app
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# prod: 非root・リロードなし・複数ワーカー
FROM python:3.13-slim AS prod
ENV PATH="/venv/bin:$PATH" PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app
COPY --from=builder /venv /venv
COPY services/model/ ./
USER 65532:65532
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
