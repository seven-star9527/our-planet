# scripts/decrypt_wechat.py
import os
import sys
# 1. 修改导入路径：从子模块导入
from pywxdump.wx_info import read_info
from pywxdump.decrypted import decrypt
from pywxdump import VERSION_LIST  # 3.x 版本需要传入版本列表

def main():
    print("🔍 正在扫描微信进程...")
    
    # 2. 获取微信账号信息
    try:
        # 3.x 版本中 read_info 需要传入 VERSION_LIST 参数
        # 它直接返回一个列表，不需要再用 list() 转换
        infos = read_info(VERSION_LIST)
        
        if not infos:
            print("❌ 未检测到登录的微信，请先登录 PC 微信！")
            return
        
        # 取第一个登录的账号
        info = infos[0]
    except Exception as e:
        print(f"❌ 获取信息失败: {e}")
        print("💡 提示：请确保微信已运行并登录。")
        return

    # 提取关键信息
    wxid = info.get("wxid")
    key = info.get("key")
    db_path = info.get("db_path") # 原始加密数据库文件夹路径
    nickname = info.get("nickname")
    
    print(f"✅ 检测到账号: {nickname} ({wxid})")
    print(f"🔑 密钥获取成功")

    # 设定输出路径
    output_dir = os.path.join(os.getcwd(), "scripts", "decrypted_db")
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # 定位 MSG.db
    msg_db_source = os.path.join(db_path, "MSG.db")
    
    # 容错：有些新版微信可能叫 MSG0.db
    if not os.path.exists(msg_db_source):
        print(f"⚠️ 在标准路径未找到 MSG.db，尝试搜索 MSG0.db...")
        msg_db_source = os.path.join(db_path, "MSG0.db")
        if not os.path.exists(msg_db_source):
             print(f"❌ 无法自动定位 MSG.db，请手动确认路径: {db_path}")
             return

    output_msg_db = os.path.join(output_dir, "MSG_decrypted.db")

    print(f"🚀 开始解密 MSG.db ...")
    print(f"   源文件: {msg_db_source}")
    print(f"   目标文件: {output_msg_db}")

    # 3. 执行解密
    try:
        # decrypt 函数签名: decrypt(key, db_path, out_path)
        result = decrypt(key, msg_db_source, output_msg_db)
        if result:
            print(f"\n🎉 解密成功！")
            print(f"📂 数据库已保存至: {output_msg_db}")
            print("👉 下一步：请修改 scripts/convert-db-to-json.ts 中的路径！")
        else:
            print("❌ 解密函数返回 False，可能是密钥错误或文件被占用。")
    except Exception as e:
         print(f"❌ 解密过程出错: {e}")

if __name__ == "__main__":
    main()