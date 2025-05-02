package repository

import (
	"github.com/PuerkitoBio/goquery"
	"github.com/gin-gonic/gin"
	"net"
	"net/http"
	"net/url"
	"strings"
)

func isSafeURL(u *url.URL) bool {
	ipRecords, err := net.LookupIP(u.Hostname())
	if err != nil {
		return false
	}
	for _, ip := range ipRecords {
		if ip.IsLoopback() || ip.IsPrivate() {
			return false
		}
	}
	return true
}

func FetchLinkPreview(c *gin.Context) {
	rawUrl := c.Query("url")
	if rawUrl == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "url is required"})
		return
	}

	parsedUrl, err := url.ParseRequestURI(rawUrl)
	if err != nil || !strings.HasPrefix(parsedUrl.Scheme, "http") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid url"})
		return
	}

	if !isSafeURL(parsedUrl) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "access to private/internal addresses is not allowed"})
		return
	}

	// Fetch page
	res, err := http.Get(parsedUrl.String())
	if err != nil || res.StatusCode != 200 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot fetch url"})
		return
	}
	defer res.Body.Close()

	doc, err := goquery.NewDocumentFromReader(res.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot parse page"})
		return
	}

	title := doc.Find("meta[property='og:title']").AttrOr("content", "")
	if title == "" {
		title = doc.Find("title").Text()
	}

	description := doc.Find("meta[property='og:description']").AttrOr("content", "")
	if description == "" {
		description = doc.Find("meta[name='description']").AttrOr("content", "")
	}

	image := doc.Find("meta[property='og:image']").AttrOr("content", "")

	c.JSON(http.StatusOK, gin.H{
		"title":       strings.TrimSpace(title),
		"description": strings.TrimSpace(description),
		"image":       image,
		"url":         rawUrl,
	})
}
