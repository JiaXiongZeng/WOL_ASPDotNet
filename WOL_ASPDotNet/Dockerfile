#See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
ARG NUGET_CONFIG_FILE=""
ARG DEBUG_MESSAGE="--verbosity n"

WORKDIR /src

RUN openssl s_client -host api.nuget.org -port 443 -prexit -showcerts > tmpfile && \
    echo | sed -n '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p' tmpfile > /usr/local/share/ca-certificates/microsoft_nuget_api.crt && \
    update-ca-certificates

COPY ["nuget.config", "."]

COPY ["WOL_ASPDotNet/WOL_ASPDotNet.csproj", "WOL_ASPDotNet/"]

RUN apt update && \
    apt upgrade && \
    apt -y install nodejs && \
    apt -y install npm

RUN dotnet restore $NUGET_CONFIG_FILE $DEBUG_MESSAGE "./WOL_ASPDotNet/WOL_ASPDotNet.csproj"

COPY . .

WORKDIR "/src/WOL_ASPDotNet"

RUN npm install && \
    dotnet build "./WOL_ASPDotNet.csproj" -c $BUILD_CONFIGURATION -o /app/build



FROM build AS publish
ARG BUILD_CONFIGURATION=Release

RUN dotnet publish "./WOL_ASPDotNet.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false



FROM base AS final
ENV TZ="Asia/Taipei"
ENV ASPNETCORE_ENVIRONMENT=Production


RUN apk update && \
    apk upgrade && \
    apk add libpcap

WORKDIR /app
COPY --from=publish /app/publish .

ENTRYPOINT ["dotnet", "WOL_ASPDotNet.dll"]