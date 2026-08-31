#!/usr/bin/env bash
# ==============================================================================
# AWS EBS Storage Expansion Script (Linux OS Filesystem Extension)
# Use after increasing the EBS Volume size in AWS Management Console
# ==============================================================================

set -e

echo "=========================================================="
echo "💾 AWS EBS Partition & Filesystem Expansion Tool"
echo "=========================================================="

echo "📊 Current Disk Space Before Resize:"
df -hT /

echo -e "\n🔍 Identifying Root Disk and Partition..."
# Detect root partition (e.g., /dev/xvda1 or /dev/nvme0n1p1)
ROOT_PART=$(df / | tail -1 | awk '{print $1}')
echo "Target Partition: $ROOT_PART"

# Determine disk device and partition number
if [[ "$ROOT_PART" =~ nvme([0-9]+)n([0-9]+)p([0-9]+) ]]; then
    DISK_DEV="/dev/nvme${BASH_REMATCH[1]}n${BASH_REMATCH[2]}"
    PART_NUM="${BASH_REMATCH[3]}"
elif [[ "$ROOT_PART" =~ (xvd[a-z]|sd[a-z])([0-9]+) ]]; then
    DISK_DEV="/dev/${BASH_REMATCH[1]}"
    PART_NUM="${BASH_REMATCH[2]}"
else
    echo "⚠️ Automatic device detection failed. Showing lsblk output:"
    lsblk
    echo "Please specify device manually (e.g. sudo growpart /dev/xvda 1)"
    exit 1
fi

echo "Disk Device: $DISK_DEV | Partition Number: $PART_NUM"

# Step 1: Install cloud-guest-utils if growpart is missing
if ! command -v growpart &> /dev/null; then
    echo "Installing cloud-guest-utils..."
    sudo apt-get update -y && sudo apt-get install -y cloud-guest-utils
fi

# Step 2: Extend the Partition
echo "🔄 Extending partition $PART_NUM on $DISK_DEV..."
sudo growpart "$DISK_DEV" "$PART_NUM" || {
    echo "ℹ️ Partition already maximum size or growpart returned: $?"
}

# Step 3: Identify Filesystem Type (ext4 or xfs)
FS_TYPE=$(df -T / | tail -1 | awk '{print $2}')
echo "Detected Filesystem Type: $FS_TYPE"

# Step 4: Resize the Filesystem
if [ "$FS_TYPE" == "xfs" ]; then
    echo "🔄 Expanding XFS filesystem on /..."
    sudo xfs_growfs /
else
    echo "🔄 Expanding EXT4 filesystem on $ROOT_PART..."
    sudo resize2fs "$ROOT_PART"
fi

echo -e "\n=========================================================="
echo "✅ EBS STORAGE EXPANSION SUCCESSFUL!"
echo "📊 Updated Disk Space:"
df -hT /
echo "=========================================================="
