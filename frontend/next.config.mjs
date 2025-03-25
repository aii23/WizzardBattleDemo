/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    distDir: 'dist',
    transpilePackages: ['../common'],
    webpack: (config) => {
        config.module.rules.push({
            test: /\.tsx?$/,
            include: [/\.\.\/common/],
            use: [
                {
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                    },
                },
            ],
        });
        return config;
    },
};

export default nextConfig;
