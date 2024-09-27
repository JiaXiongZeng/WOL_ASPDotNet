import { UserConfig, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


// Get base folder for certificates.
const baseFolder =
    process.env.APPDATA !== undefined && process.env.APPDATA !== ''
        ? `${process.env.APPDATA}/ASP.NET/https`
        : `${process.env.HOME}/.aspnet/https`;

// Generate the certificate name using the NPM package name
const certificateName = process.env.npm_package_name;

// Define certificate filepath
const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
// Define key filepath
const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

// https://vitejs.dev/config/
export default defineConfig(async () => {
    // Ensure the certificate and key exist
    if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
        // Wait for the certificate to be generated
        await new Promise<void>((resolve) => {
            spawn('dotnet', [
                'dev-certs',
                'https',
                '--export-path',
                certFilePath,
                '--format',
                'Pem',
                '--no-password',
            ], { stdio: 'inherit', })
                .on('exit', (code) => {
                    resolve();
                    if (code) {
                        process.exit(code);
                    }
                });
        });
    }

    const root = 'ClientSrc';

    const config: UserConfig = {
        appType: 'custom',
        plugins: [
            { enforce: 'pre', ...mdx() },
            react({ include: /\.(mdx|js|jsx|ts|tsx)$/ })
        ],
        root: `${root}`,
        publicDir: 'public',
        build: {
            emptyOutDir: true,
            outDir: '../wwwroot',
            manifest: "vite-manifest.json",            
            assetsDir: 'ClientSrc/assets',
            rollupOptions: {
                input: [
                    'ClientSrc/HostIndex.tsx'
                ],
                output: {
                    manualChunks: (id) => {
                        //console.log(id);
                        if (id.includes('node_modules')) {
                            const arr = id.toString().split('node_modules/')[1].split('/');
                            switch (arr[0]) {
                                case 'anyPacketWantToUseDefaultChunkDivisionLogic':
                                    return;
                                case '@mui':
                                    return `${arr[0]}_${arr[1]}`;
                                default:
                                    return arr[0];
                            }
                        }
                    }
                }
            }
        },
        server: {
            strictPort: true,
            https: {
                cert: certFilePath,
                key: keyFilePath
            }
        },
        optimizeDeps: {
            include: []
        },
        resolve: {
            alias: [
                { find: '@styles', replacement: fileURLToPath(new URL(`./${root}/styles`, import.meta.url)) },
                { find: '@components', replacement: fileURLToPath(new URL(`./${root}/components`, import.meta.url)) },
                { find: '@assets', replacement: fileURLToPath(new URL(`./${root}/assets`, import.meta.url)) },
                { find: '@models', replacement: fileURLToPath(new URL(`./${root}/models`, import.meta.url)) },
                { find: '@utilities', replacement: fileURLToPath(new URL(`./${root}/utilities`, import.meta.url)) }
            ]
        }
    };

    return config;
});
