FROM golang:1.26-alpine

WORKDIR /app



COPY . .

RUN go build -o app ./cmd/api

EXPOSE 8080

CMD ["./app"]