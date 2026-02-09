package webdav

import (
	"fmt"
	"path"
	"strings"
	"time"

	"github.com/studio-b12/gowebdav"
)

// File represents a configuration file
type File struct {
	Name    string `json:"name" yaml:"name"`
	Content string `json:"content" yaml:"content"`
}

// Client represents a WebDAV sync client
type Client struct {
	baseURL  string
	username string
	password string
	client   *gowebdav.Client
}

// NewClient creates a new WebDAV client
func NewClient(baseURL, username, password string) *Client {
	c := gowebdav.NewClient(baseURL, username, password)
	return &Client{
		baseURL:  strings.TrimRight(baseURL, "/"),
		username: username,
		password: password,
		client:   c,
	}
}

// Get retrieves files from the specified directory
func (c *Client) Get(dir string) ([]File, error) {
	if dir == "" {
		dir = "tabby-config"
	}

	files, err := c.client.ReadDir(dir)
	if err != nil {
		// Directory doesn't exist, return empty
		if strings.Contains(err.Error(), "404") || strings.Contains(err.Error(), "Not Found") {
			return []File{}, nil
		}
		return nil, fmt.Errorf("failed to list directory: %w", err)
	}

	var result []File
	for _, f := range files {
		if f.IsDir() {
			continue
		}

		content, err := c.client.Read(path.Join(dir, f.Name()))
		if err != nil {
			continue // Skip files we can't read
		}

		result = append(result, File{
			Name:    f.Name(),
			Content: string(content),
		})
	}

	return result, nil
}

// Sync uploads files to the specified directory
// Returns the directory name used
func (c *Client) Sync(dir string, files []File) (string, error) {
	if dir == "" {
		dir = fmt.Sprintf("tabby-config-%d", time.Now().Unix())
	}

	// Create directory if it doesn't exist
	err := c.client.MkdirAll(dir, 0755)
	if err != nil {
		return "", fmt.Errorf("failed to create directory: %w", err)
	}

	// Upload all files
	for _, file := range files {
		filePath := path.Join(dir, file.Name)
		err := c.client.Write(filePath, []byte(file.Content), 0644)
		if err != nil {
			return "", fmt.Errorf("failed to write file %s: %w", file.Name, err)
		}
	}

	return dir, nil
}

// Delete removes the entire directory
func (c *Client) Delete(dir string) error {
	if dir == "" {
		return fmt.Errorf("directory name required")
	}

	// List and delete all files first
	files, err := c.client.ReadDir(dir)
	if err != nil {
		// Directory doesn't exist, consider it success
		if strings.Contains(err.Error(), "404") || strings.Contains(err.Error(), "Not Found") {
			return nil
		}
		return fmt.Errorf("failed to list directory: %w", err)
	}

	// Delete all files
	for _, f := range files {
		if f.IsDir() {
			continue
		}
		filePath := path.Join(dir, f.Name())
		if err := c.client.Remove(filePath); err != nil {
			// Continue even if some files fail to delete
			continue
		}
	}

	// Remove the directory itself
	if err := c.client.Remove(dir); err != nil {
		return fmt.Errorf("failed to remove directory: %w", err)
	}

	return nil
}
