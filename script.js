const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');
const process = require('process');

// 从repoUrl中提取仓库名
function getRepoName(repoUrl) {
    const repoNameMatch = repoUrl.match(/\/([^\/]+)\.git$/);
    return repoNameMatch ? repoNameMatch[1] : 'local_repository';
}

// 克隆GitHub仓库到本地
async function cloneRepository(repoUrl, localPath) {
    const git = simpleGit();
    await git.clone(repoUrl, localPath);
    console.log(`仓库已克隆到 ${localPath}`);
}

// 检查文件是否为图片或二进制文件
function isExcludedFile(file) {
    const excludedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.ico', '.bin'];
    const ext = path.extname(file).toLowerCase();
    return excludedExtensions.includes(ext);
}

// 递归遍历文件夹并生成内容和统计信息
function traverseDirectory(directoryPath, level = 1, parentPath = '', formatStats = {}) {
    let content = '';
    const files = fs.readdirSync(directoryPath);

    files.forEach(file => {
        const filePath = path.join(directoryPath, file);
        const stats = fs.statSync(filePath);
        const relativePath = path.join(parentPath, file);

        if (stats.isDirectory()) {
            content += `${'#'.repeat(level)} ${file}\n`;
            content += traverseDirectory(filePath, level + 1, relativePath, formatStats);
        } else if (stats.isFile() && !isExcludedFile(file)) {
            const ext = path.extname(file).toLowerCase();
            formatStats[ext] = (formatStats[ext] || 0) + 1;

            const fileContent = fs.readFileSync(filePath, 'utf8');
            content += `${'#'.repeat(level)} ${relativePath}\n${fileContent}\n\n`;
        }
    });

    return { content, formatStats };
}

// 写入内容到文件
function writeToFile(content, outputFilePath) {
    fs.writeFileSync(outputFilePath, content, 'utf8');
    console.log(`代码已写入 ${outputFilePath}`);
}

// 写入统计信息到文件
function writeFormatStats(formatStats, outputFilePath) {
    let content = '文件格式统计:\n';
    for (const [ext, count] of Object.entries(formatStats)) {
        content += `${ext}: ${count}\n`;
    }
    fs.writeFileSync(outputFilePath, content, 'utf8');
    console.log(`格式统计已写入 ${outputFilePath}`);
}

// 主函数
async function main(repoUrl) {
    const repoName = getRepoName(repoUrl);
    const localPath = `./${repoName}`; // 使用仓库名作为本地路径
    const outputFilePath = `./${repoName}.txt`; // 使用仓库名生成的TXT文件路径
    const formatStatsPath = `./format.txt`; // 文件格式统计文件路径

    // 克隆仓库到本地
    await cloneRepository(repoUrl, localPath);

    // 读取文件夹并生成内容和统计信息
    const { content, formatStats } = traverseDirectory(localPath);

    // 写入内容到文件
    writeToFile(content, outputFilePath);

    // 写入统计信息到文件
    writeFormatStats(formatStats, formatStatsPath);
}

// 解析命令行参数
const repoUrl = process.argv[2];
if (!repoUrl) {
    console.error('请提供GitHub仓库URL作为参数');
    process.exit(1);
}

// 运行主函数
main(repoUrl).catch(console.error);

